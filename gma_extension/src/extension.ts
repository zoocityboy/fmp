import * as vscode from 'vscode';
import { WorkspaceConfigurator } from './modules/flavor/worksapce_configurator';
import { LocalhostBrowserPanel } from './modules/servers/server_browser';
import { Constants } from './models/constants';
import buildFlowInputs from './modules/flavor/flavor_picker';
import { registerBuildRunner } from './modules/build_runner/build_runner';
import { ProgressStatus } from './models/dto/progress_state';
import { IState } from './models/interfaces/i_state';
import { FlavorStatusbarItem } from './modules/flavor/flavor_statusbar_item';
import { HelpTreeProvider } from './modules/help/help_tree_data_provider';
import { FileExplorer, GlobExplorer } from './modules/explorer';
import { ServerTreeProvider } from './modules/servers/server_runner';
import {  GmaConfigurationFile } from './models';
import { YamlUtils } from './core/yaml_utils';
import { CommandRunner } from './modules/runner/command_runner';
import { CommandBuildTaskProvider } from './modules/runner/command_definition';
import { CommentsService } from './modules/comments/comments';
let flavorStatusBarItem: FlavorStatusbarItem | undefined;
let flavorConfig: WorkspaceConfigurator;
let isGmaWorkspace: boolean = false;
let tasksProvider: CommandBuildTaskProvider | undefined;
const browsers: Map<String, LocalhostBrowserPanel> = new Map();
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
			flavorConfig.onDidChanged((value) => {
				console.log(value);
				switch (value.status) {
					case ProgressStatus.loading:
						flavorStatusBarItem?.update({ status: value.status });
						break;
					case ProgressStatus.failed:
						updateStatusBar(context);
						break;
					case ProgressStatus.success:
						updateStatusBar(context, value.value);
						break;
				}
			});
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
		tasksProvider?.dispose();
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
		tasksProvider = CommandBuildTaskProvider.register(context, flavorConfig.getRootFolder()!);

		const plugins = new FileExplorer(context, Constants.gmaPluginsView, 'plugins');
		const project = new FileExplorer(context, Constants.gmaProjectView);
		await plugins.registerCommands(context);
		await project.registerCommands(context);
		// new CommentsService(context);
	} catch (e) {}
}

export async function registerServers(context: vscode.ExtensionContext) {
	const servers = configuration?.apps.filter(app => app.port !== undefined) ?? [];
	for (const app of servers) {
		context.subscriptions.push(
			vscode.commands.registerCommand(app.commandId, () => {
				const exists = browsers.get(app.packageName);
				if (exists !== undefined) {
					exists.show();
					return;
				}
				const sereverPanel = LocalhostBrowserPanel.register(context, app);
				browsers.set(app.packageName, sereverPanel);
			})
		);
		if (vscode.window.registerWebviewPanelSerializer) {
			vscode.window.registerWebviewPanelSerializer(app.viewType, {
				async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
					webviewPanel.webview.options = LocalhostBrowserPanel.getWebviewOptions(context.extensionUri);
					browsers.get(app.packageName)?.revive(webviewPanel, context.extensionUri);
				}
			});
		}
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