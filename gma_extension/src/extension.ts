import * as vscode from 'vscode';
import indexPage from './modules/servers/templates/index.html';
import errorPage from './modules/servers/templates/404.html';
import { WorkspaceConfigurator } from './modules/flavor/worksapce_configurator';
import { Constants } from './models/constants';
import buildFlowInputs from './modules/flavor/flavor_picker';
import { registerBuildRunner } from './modules/build_runner/build_runner';
import { ProgressStatus } from './models/dto/progress_state';
import { IState } from './models/interfaces/i_state';
import { FlavorStatusbarItem } from './modules/flavor/flavor_statusbar_item';
import { HelpTreeProvider } from './modules/help/help_tree_data_provider';
import { FileExplorer, GlobExplorer } from './modules/explorer';
import { ServerTreeItem, ServerTreeProvider } from './modules/servers/server_runner';
import {  GmaAppConfiguration, GmaConfigurationFile } from './models';
import { YamlUtils } from './core/yaml_utils';
import { CommandRunner } from './modules/runner/command_runner';
import { Process } from './core';
// import { CommandBuildTaskProvider } from './modules/runner/command_definition';
// import { CommentsService } from './modules/comments/comments';
let flavorStatusBarItem: FlavorStatusbarItem | undefined;
let flavorConfig: WorkspaceConfigurator;
let isGmaWorkspace: boolean = false;
const browsers: Map<String, vscode.WebviewPanel> = new Map();
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
let configuration: GmaConfigurationFile | undefined;
export function activate(context: vscode.ExtensionContext): void {
	console.log('Congratulations, activattion proces of "GMA Studio" started...');
	isGmaWorkspace = vscode.workspace.workspaceFile?.path.endsWith(Constants.workspaceFileName) ?? false;
	console.log(`Extension "isGmaWorkspace" ${isGmaWorkspace} is now active!`);
	if (isGmaWorkspace) {
		configuration = new YamlUtils().load();
		console.log('Congratulations, your extension "GMA Studio" is now active!');
		try {
			flavorConfig = new WorkspaceConfigurator(context);
		} catch (e) {
			console.log(e);
		}
		initialization(context);
		
	} else {
		console.log('Cant use GMA Studio without correct gma.code-workspace.');
		flavorStatusBarItem?.hide();
	}

}


export function deactivate() {
	if (isGmaWorkspace === true) {
		browsers.forEach(browser => browser.dispose());
		ServerTreeProvider.instance.dispose();
		flavorStatusBarItem?.dispose();
		console.log('Congratulations, your extension "GMA Studio" is now de-active!');
		flavorConfig.dispose();

	}
}
export async function initialization(context: vscode.ExtensionContext): Promise<void> {
	try{
		await registerServers(context);
		await registerBuildRunner(context);
		await registerChangeFlavorMultiStep(context);

		HelpTreeProvider.register(context);
		new GlobExplorer(context, {viewId: Constants.gmaCiCdView, pattern: Constants.gmaGlobPatternPipelines});
		new GlobExplorer(context, {viewId: Constants.gmaDocumentationView, pattern: Constants.gmaGlobPatternDocumentation});
		
		ServerTreeProvider.register(context);
		CommandRunner.register(context, configuration!);
		const plugins = new FileExplorer(context, Constants.gmaPluginsView, 'plugins');
		const project = new FileExplorer(context, Constants.gmaProjectView);
		await plugins.registerCommands(context);
		// new CommentsService(context);
	} catch (e) {}
}

export async function registerServers(context: vscode.ExtensionContext) {
	const servers = configuration?.apps.filter(app => app.port !== undefined) ?? [];
	context.subscriptions.push(
		vscode.commands.registerCommand(Constants.gmaCommandServerShow, (app) => openServer(context, app)),
			vscode.commands.registerCommand(Constants.gmaCommandServerStart, (app) => operateServer(app, 'start')),
			vscode.commands.registerCommand(Constants.gmaCommandServerStop, (app) => operateServer(app, 'stop')),
	);
	for (const app of servers) {
		// browsers.set(app.packageName, LocalhostBrowserPanel.register(context, app));
		
		// if (vscode.window.registerWebviewPanelSerializer) {
		// 	vscode.window.registerWebviewPanelSerializer(app.viewType, {
		// 		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
		// 			webviewPanel.webview.options = LocalhostBrowserPanel.getWebviewOptions(context.extensionUri);
		// 			browsers.get(app.packageName)?.revive(webviewPanel, context.extensionUri, app);
		// 		}
		// 	});
		// }
	}
	

}
export async function openServer(context: vscode.ExtensionContext, app: GmaAppConfiguration) {
	const currentPanel = browsers.get(app.packageName);
	const url = await vscode.env.asExternalUri(
		vscode.Uri.parse(`http://localhost:${app.port}?time=${Date()}`)
	);
	if (currentPanel) {
		const isRunning = Process.instance.isServerRunning(app);
		currentPanel.webview.html = isRunning ? 
			indexPage({webview: currentPanel.webview, extensionUri: context.extensionUri, url: url, app }) : 
			errorPage({webview: currentPanel.webview, extensionUri: context.extensionUri, url: url , app}) ;
		currentPanel.reveal();
	} else {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;
		const newPanel =vscode.window.createWebviewPanel(app.viewType, app.title, column || vscode.ViewColumn.Two, {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'resources','webview')]
        });
		
		const isRunning = Process.instance.isServerRunning(app);
		newPanel.webview.html = isRunning ? 
			indexPage({webview: newPanel.webview, extensionUri: context.extensionUri, url: url, app }) : 
			errorPage({webview: newPanel.webview, extensionUri: context.extensionUri, url: url, app }) ;
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
				panel!.webview.html = isRunning ? 
					indexPage({webview: panel!.webview, extensionUri: context.extensionUri, url: url, app }) : 
					errorPage({webview: panel!.webview, extensionUri: context.extensionUri, url: url, app }) ;
			}
		});
		newPanel.webview.onDidReceiveMessage(message => {
			switch(message.command) {
				case 'build':
					console.log('build');
					break;
				case 'run':
					console.log('run');
					break;
			}
		});
		browsers.set(app.packageName, newPanel);	
	}
	
	
}
export async function operateServer(item: ServerTreeItem, status: 'stop' | 'start'){
	if (status === 'stop') {
		Process.instance.terminate(item.model.serverComandId).then(() => {
			ServerTreeProvider.instance.refresh();
		});
	} else if (status === 'start') {
		Process.instance.runServer(item.model, (_) => {
			ServerTreeProvider.instance.refresh();
		}, ()=> {
			ServerTreeProvider.instance.refresh();
		});
	}
}


export async function registerChangeFlavorMultiStep(context: vscode.ExtensionContext) {
	flavorStatusBarItem = FlavorStatusbarItem.register(context, () => {
		console.log('flavorStatusBarItem clicked');
		changeFlavorFlow(context);
	});

	vscode.workspace.onDidChangeConfiguration((value) => {
		if (value.affectsConfiguration(Constants.gmaConfigBuildSelectedApplication) || value.affectsConfiguration(Constants.gmaConfigBuildSelectedCountry) || value.affectsConfiguration(Constants.gmaConfigBuildSelectedStage)) {
			console.log(`value: ${value}`);
			updateStatusBar(context);
		}
	});
	updateStatusBar(context);
	let defaultState = await getDefaultState(context);
	runUpdateFlavor(defaultState);
}

async function getDefaultState(context: vscode.ExtensionContext): Promise<IState> {
	return {
		app: flavorConfig.getApp(),
		country: flavorConfig.getCountry(),
		stage: flavorConfig.getStage(),
		totalSteps: 3,
		step: 1,
	} as IState;
}

export async function changeFlavorFlow(context: vscode.ExtensionContext) {
	const result = await buildFlowInputs(flavorConfig);
	await runUpdateFlavor(result);
}

export async function runUpdateFlavor(value?: IState | undefined) {
	if (value === undefined) {
		return;
	}
	flavorConfig.runCommand(value);

}

async function updateStatusBar(context: vscode.ExtensionContext, value?: IState | undefined) {
	const defaultState = value ?? await getDefaultState(context);
	flavorStatusBarItem?.update({ state: defaultState, status: ProgressStatus.success });
}