import * as vscode from "vscode";
import { Process } from "../../core";
import { YamlUtils } from "../../core/yaml_utils";
import { GmaAppConfiguration, GmaConfigurationFile, ServerCommand, ServerStatus } from "../../models";
import { Constants } from "../../models/constants";
import errorPage from '../../modules/servers/templates/404.html';
import indexPage from '../../modules/servers/templates/index.html';
import * as os from 'os';
import { OutputTask } from '../../core/processes_utils';
import * as childProcess from 'child_process';
import { kill } from "process";

const browsers: Map<string, vscode.WebviewPanel> = new Map();
export class ServerTreeItem extends vscode.TreeItem{
    public contextValue = 'server';
    
    constructor(
        public readonly title: string,
        public readonly model: GmaAppConfiguration,
        
    ){
        super(title, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon("globe");
        this.command = {
            command: Constants.gmaCommandServerShow,
            title: 'Open',
            arguments: [model]
        } as vscode.Command;
    }
}
type EventEmitterServerTreeItem = ServerTreeItem | undefined | void;

export class ServerTreeProvider implements vscode.TreeDataProvider<ServerTreeItem>{
    private data: GmaConfigurationFile | undefined;
    private items: ServerTreeItem[] = [];
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	private pidtree = require('pidtree');

    private constructor() { 
        this.loadData();
    }
    private loadData(): void {
        const utils = new YamlUtils();
        this.data = utils.load();
        this.data?.servers.forEach((item) => {
            this.items.push(new ServerTreeItem(item.title, item));
        });
        
    }
    private static _instance: ServerTreeProvider;
    static get instance() {
        this._instance ??= new ServerTreeProvider();
        return this._instance;
    }

    private readonly eventEmitter = new vscode.EventEmitter<EventEmitterServerTreeItem>();

    readonly refresh = (): void => this.eventEmitter.fire();

    readonly onDidChangeTreeData = this.eventEmitter.event;

    getTreeItem(element: ServerTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        const isRunning = Process.instance.isServerRunning(element.model);
        console.log(`getTreeItem: ${element.model.serverComandId} ${isRunning.toString()}`);
        element.contextValue = isRunning ? ServerStatus.running : ServerStatus.stopped;
        return Promise.resolve(element);
    }
    getChildren(_element?: ServerTreeItem): vscode.ProviderResult<ServerTreeItem[]> {
		console.log(`ServerTreeProvider.getChildren ${_element}`);
        return Promise.resolve(this.items);
    }
    static register(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.window.registerTreeDataProvider(Constants.gmaServersView, ServerTreeProvider.instance));
    }

}

export function activate(context: vscode.ExtensionContext){
    ServerTreeProvider.register(context);
	context.subscriptions.push(
		vscode.commands.registerCommand(Constants.gmaCommandServerShow, (app) => openServer(context, app)),
			vscode.commands.registerCommand(Constants.gmaCommandServerStart, (app) => operateServer(app, ServerCommand.start)),
			vscode.commands.registerCommand(Constants.gmaCommandServerStop, (app) => operateServer(app, ServerCommand.stop)),
	);
}
export function deactivate() {
    browsers.forEach((browser) => {
        browser?.dispose();
    });
    
}

async function openServer(context: vscode.ExtensionContext, app: GmaAppConfiguration) {
	const currentPanel = browsers.get(app.packageName);
	const url = await vscode.env.asExternalUri(
		vscode.Uri.parse(`http://localhost:${app.port}?time=${Date()}`)
	);
	if (currentPanel) {
		const isRunning = Process.instance.isServerRunning(app);
		currentPanel.webview.html = isRunning ? 
			indexPage({webview: currentPanel.webview, extensionUri: context.extensionUri, url: url, app }) : 
			errorPage({webview: currentPanel.webview, context: context, url: url , app}) ;
		currentPanel.reveal();
	} else {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;
		const newPanel =vscode.window.createWebviewPanel(app.viewType, app.title, column || vscode.ViewColumn.Two, {
            enableScripts: true,
            enableCommandUris: true,
			retainContextWhenHidden: true,
			enableForms: true,
            localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, 'resources','webview'),
				vscode.Uri.joinPath(context.extensionUri, 'resources','images'),
			]
        } as vscode.WebviewOptions);
		
		const isRunning = Process.instance.isServerRunning(app);
		newPanel.webview.html = isRunning ? 
			indexPage({webview: newPanel.webview, extensionUri: context.extensionUri, url: url, app }) : 
			errorPage({webview: newPanel.webview, context: context, url: url, app }) ;
		newPanel.onDidDispose(
			() => {
				browsers.get(app.packageName)?.dispose();
				browsers.delete(app.packageName);
			},
			null,
			context.subscriptions
		  );
		newPanel.onDidChangeViewState(e => {
			if (e.webviewPanel.visible) {
				const isRunning = Process.instance.isServerRunning(app);
				const panel = browsers.get(app.packageName);
				if (panel){
				panel.webview.html = isRunning ? 
					indexPage({webview: panel.webview, extensionUri: context.extensionUri, url: url, app }) : 
					errorPage({webview: panel.webview, context: context, url: url, app }) ;
				}
			}
		});
		browsers.set(app.packageName, newPanel);	
	}
	
	
}
function operateServer(item: ServerTreeItem, status: ServerCommand) {
	
	switch (status) {
		case ServerCommand.start:
			Process.instance.runServer(item.model).then(() => {
				console.log('runServer: ${data}');
				ServerTreeProvider.instance.refresh();
				void vscode.commands.executeCommand(Constants.gmaCommandServerShow, item.model);
			}).catch(async () => {
				await killServer();
				ServerTreeProvider.instance.refresh();
			}).finally(() => {
				ServerTreeProvider.instance.refresh();
			});
			break;
		case ServerCommand.stop:
			void Process.instance.terminate(item.model.serverComandId).then(() => {
				ServerTreeProvider.instance.refresh();
			});
			break;
	}
}


async function killServer(): Promise<void> {
	const isWindow = os.platform() === 'win32';
	const command: string = isWindow ? 'taskkill' : 'killall';
	const args: string[] = isWindow ? ['/F', '/IM', Constants.gmaServerName] : ['-9', Constants.gmaServerName];
	// // eslint-disable-next-line @typescript-eslint/no-unsafe-call
	const task = new vscode.Task({
		type: 'gma',
	} as vscode.TaskDefinition, vscode.TaskScope.Workspace, 'gma', 'gma', new vscode.ShellExecution(
		command, args,
	),);

	console.log(`${command} ${args.join(' ')}`);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	try {
		const execution = await vscode.tasks.executeTask(task);
		console.log(`${execution.task.name} ${execution.task.detail}`);
	}
	catch (e) {
		// catch execution exceptions and show a message to the user
		return Promise.reject(e);
	}
	
	// const process = childProcess.spawn(command, args, {
	// 	shell: os.platform() === 'win32', 
	// 	stdio: 'pipe', 
	// 	detached: false, 
	// 	windowsVerbatimArguments: false 
	// } as childProcess.SpawnOptionsWithoutStdio);
	// process.stdout?.on('data', (value) => {
	// 	console.log(`killServer: stdout: ${value}`);
	// });

	// process.stderr?.on('data', (value) => {
	// 	console.error(`killServer: stderr: ${value}`);
	// });
	// process.on('error', (err) => {
	// 	console.error(`killServer: error: ${err}`);
	// });
	// process.on('exit', (code) => {
	// 	console.log(`killServer: exit: ${code}`);
	// });

}