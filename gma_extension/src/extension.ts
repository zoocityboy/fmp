import * as vscode from 'vscode';

import { WorkspaceConfigurator } from './modules/flavor/worksapce_configurator';
import { Constants } from './models/constants';
import buildFlowInputs from './modules/flavor/flavor_picker';
import { registerBuildRunner } from './modules/build_runner/build_runner';
import { ProgressStatus } from './models/dto/progress_state';
import { IState } from './models/interfaces/i_state';
import { FlavorStatusbarItem } from './modules/flavor/flavor_statusbar_item';
import { HelpTreeProvider } from './modules/help/help_tree_data_provider';
import { FileExplorer, GlobExplorer } from './modules/explorer';
import { YamlUtils } from './core/yaml_utils';
import { CommandRunner } from './modules/runner/command_runner';
import { GmaConfigurationFile } from './models';
import * as serverRunner from './modules/servers/server_runner';
let flavorStatusBarItem: FlavorStatusbarItem | undefined;
let flavorConfig: WorkspaceConfigurator;
let isGmaWorkspace: boolean = false;

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
let configuration: GmaConfigurationFile | undefined;
let isInitialized: boolean = false;
export function activate(context: vscode.ExtensionContext): void {
	console.log('Congratulations, activattion proces of "GMA Studio" started...');
	isGmaWorkspace = vscode.workspace.workspaceFile?.path.endsWith(Constants.workspaceFileName) ?? false;
	console.log(`Extension "isGmaWorkspace" ${isGmaWorkspace} is now active ${isInitialized}!`);
	if (isGmaWorkspace) {
		configuration = new YamlUtils().load();
		if (!isInitialized){
			console.log('Congratulations, your extension "GMA Studio" is now active!');
			try {
				flavorConfig = new WorkspaceConfigurator(context);
				flavorConfig.onDidChanged((e) => {
					console.log('Workspace configurator changed message: ${e}');
				});
			} catch (e) {
				console.log(e);
			}
			initialization(context);
		}
	} else {
		console.log('Cant use GMA Studio without correct gma.code-workspace.');
		flavorStatusBarItem?.hide();
	}

}

export function deactivate() {
	if (isGmaWorkspace === true) {
		serverRunner.deactivate();
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
		
		serverRunner.activate(context);
		CommandRunner.register(context, configuration!);
		const plugins = new FileExplorer(context, Constants.gmaPluginsView, 'plugins');
		const project = new FileExplorer(context, Constants.gmaProjectView);
		await plugins.registerCommands(context);
		isInitialized = true;
		// new CommentsService(context);
	} catch (e) {
		console.log(e);
	}
}

export async function registerServers(context: vscode.ExtensionContext) {
	// const servers = configuration?.apps.filter(app => app.port !== undefined) ?? [];
	// context.subscriptions.push(
	// 	vscode.commands.registerCommand(Constants.gmaCommandServerShow, (app) => openServer(context, app)),
	// 		vscode.commands.registerCommand(Constants.gmaCommandServerStart, (app) => operateServer(app, 'start')),
	// 		vscode.commands.registerCommand(Constants.gmaCommandServerStop, (app) => operateServer(app, 'stop')),
	// );

}

export async function registerChangeFlavorMultiStep(context: vscode.ExtensionContext) {
	flavorStatusBarItem = FlavorStatusbarItem.register(context, () => {
		console.log('flavorStatusBarItem clicked');
		changeFlavorFlow(context);
	});
	context.subscriptions.push(
	vscode.workspace.onDidChangeConfiguration((value) => {
		if (value.affectsConfiguration(Constants.gmaConfigBuildSelectedApplication) || value.affectsConfiguration(Constants.gmaConfigBuildSelectedCountry) || value.affectsConfiguration(Constants.gmaConfigBuildSelectedStage)) {
			console.log(`value: ${value}`);
			updateStatusBar(context);
			
		}
	}));
	updateStatusBar(context);
	// let defaultState = await getDefaultState(context);
	// await runUpdateFlavor(defaultState);
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