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
import { CommandRunner } from './modules/runner/command_runner';
import * as serverRunner from './modules/servers/server_runner';
import { GmaConfig } from './modules/flavor/workspace_config';
let flavorStatusBarItem: FlavorStatusbarItem | undefined;
let flavorConfig: WorkspaceConfigurator;
let isGmaWorkspace = false;

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
let isInitialized = false;
export function activate(context: vscode.ExtensionContext): void {
	console.log('Congratulations, activattion proces of "GMA Studio" started...');
	isGmaWorkspace = vscode.workspace.workspaceFile?.path.endsWith(Constants.workspaceFileName) ?? false;
	console.log(`Extension "isGmaWorkspace" ${isGmaWorkspace} is now active ${isInitialized}!`);
	if (isGmaWorkspace) {
		if (!isInitialized){
			console.log('Congratulations, your extension "GMA Studio" is now active!');
			try {
				flavorConfig = new WorkspaceConfigurator(context);
			} catch (e) {
				console.log(e);
			}
			void initialization(context);
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
export async function initialization(this: any, context: vscode.ExtensionContext): Promise<void> {
	try{
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _init = GmaConfig.instance;
		await registerBuildRunner(context);
		registerChangeFlavorMultiStep(context);

		HelpTreeProvider.register(context);
		new GlobExplorer(context, {viewId: Constants.gmaCiCdView, pattern: Constants.gmaGlobPatternPipelines});
		new GlobExplorer(context, {viewId: Constants.gmaDocumentationView, pattern: Constants.gmaGlobPatternDocumentation});
		
		serverRunner.activate(context);
		
		CommandRunner.register(context);
		
		FileExplorer.registerCommands(context);
		new FileExplorer(context, Constants.gmaPluginsView, 'plugins');
		new FileExplorer(context, Constants.gmaProjectView);
		
		isInitialized = true;
		// new CommentsService(context);
	} catch (e) {
		console.log(e);
	}
}

export function registerChangeFlavorMultiStep(context: vscode.ExtensionContext) {
	flavorStatusBarItem = FlavorStatusbarItem.register(context, () => {
		console.log('flavorStatusBarItem clicked');
		void changeFlavorFlow();
	});
	context.subscriptions.push(
	vscode.workspace.onDidChangeConfiguration( (value) => {
		if (value.affectsConfiguration(Constants.gmaConfigBuildSelectedApplication) || value.affectsConfiguration(Constants.gmaConfigBuildSelectedCountry) || value.affectsConfiguration(Constants.gmaConfigBuildSelectedStage)) {
			console.log(`value: ${value}`);
			updateStatusBar(context);
		}
	}));
	updateStatusBar(context);
	const defaultState = getDefaultState();
	runUpdateFlavor(defaultState);
}

function getDefaultState() {
	return {
		app: flavorConfig.getApp(),
		country: flavorConfig.getCountry(),
		stage: flavorConfig.getStage(),
		totalSteps: 3,
		step: 1,
	} as IState;
}

export async function changeFlavorFlow() {
	const result = await buildFlowInputs(flavorConfig);
	runUpdateFlavor(result);
}

export function runUpdateFlavor(value?: IState | undefined) {
	if (value === undefined) {
		return;
	}
	void flavorConfig.runCommand(value);	

}

function updateStatusBar(context: vscode.ExtensionContext, value?: IState | undefined) {
	const defaultState = value ?? getDefaultState();
	flavorStatusBarItem?.update({ state: defaultState, status: ProgressStatus.success });
}