import { ExtensionContext, workspace, window, commands } from 'vscode';
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
import { Update } from './core/update';
let flavorStatusBarItem: FlavorStatusbarItem | undefined;
let flavorConfig: WorkspaceConfigurator;
let isGmaWorkspace = false;

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
export function activate(context: ExtensionContext): void {
	console.log('Congratulations, activattion proces of "GMA Studio" started...');
	isGmaWorkspace = workspace.workspaceFile?.path.endsWith(Constants.workspaceFileName) ?? false;
	console.log(`Extension "isGmaWorkspace" ${isGmaWorkspace} is now active!`);
	void commands.executeCommand('setContext', Constants.gmaIsWorkspaceAvailable, isGmaWorkspace);
	if (isGmaWorkspace) {
		console.log('Congratulations, your extension "GMA Studio" is now active!');
		try {
			flavorConfig = new WorkspaceConfigurator(context);
			flavorConfig.onDidChanged(() => {
				updateStatusBar();
			});
		} catch (e) {
			console.log(e);
		}
		void initialization(context);
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
export async function initialization(this: any, context: ExtensionContext): Promise<void> {
	try{
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _init = GmaConfig.i;
		await registerBuildRunner(context);
		HelpTreeProvider.register(context);
		new GlobExplorer(context, {viewId: Constants.gmaCiCdView, pattern: Constants.gmaGlobPatternPipelines});
		new GlobExplorer(context, {viewId: Constants.gmaDocumentationView, pattern: Constants.gmaGlobPatternDocumentation});
		serverRunner.activate(context);
		CommandRunner.register(context);
		FileExplorer.registerCommands(context);
		new FileExplorer(context, Constants.gmaPluginsView, Constants.gmaCommandExplorerPluginsRefresh, 'plugins');
		new FileExplorer(context, Constants.gmaProjectView, Constants.gmaCommandExplorerProjectRefresh);
		registerChangeFlavorMultiStep(context);
		await worksapceInitWalkthrough(context);
		
	} catch (e) {
		console.log(e);
	}
}

export function registerChangeFlavorMultiStep(context: ExtensionContext) {
	flavorStatusBarItem = FlavorStatusbarItem.register(context, () => {
		console.log('flavorStatusBarItem clicked');
		void changeFlavorFlow();
	});
	context.subscriptions.push(
	workspace.onDidChangeConfiguration( () => {
		updateStatusBar();
	}));
	updateStatusBar();
	
	
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

function updateStatusBar(value?: IState | undefined) {
	const defaultState = value ?? getDefaultState();
	flavorStatusBarItem?.update({ state: defaultState, status: ProgressStatus.success });
}

export async function worksapceInitWalkthrough(context: ExtensionContext){
	const updater = new Update(context);
	function updateWorksapce() {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		window.showInformationMessage('Do you want update workspace?', 'No', 'Yes').then((value) => {
			if (value === 'Yes') {
				const defaultState = getDefaultState();
				runUpdateFlavor(defaultState);
			}
		});
	}
	await updater.isUpdateAvailable().then(async update => {
		if (update !== undefined) {
			await window.showInformationMessage(`Please update GMA Studio extension. ${update.version}`, 'Not now.', 'Update').then(async (response) => {
				if (response === 'Update') {
					await updater.installUpdate(update);
					updateWorksapce();
				} else{
					updater.postponeUpdate();
					updateWorksapce();
				} 
			});
		} else {
			updateWorksapce();
		}
	}).catch(e => {
		console.error(e);
		updateWorksapce();
	});
}