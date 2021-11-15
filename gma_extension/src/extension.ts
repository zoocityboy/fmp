import * as vscode from 'vscode';
import { WorkspaceConfigurator } from './modules/flavor/worksapce_configurator';
import { ChangeFlavorTask } from './modules/flavor/tasks';
import { WidgetCatalogPanel } from './modules/panel/widget_catalog_panel';
import { DynamicPlaygroundPanel } from './modules/panel/dynamic_forms_panel';
import { Constants } from './models/constants';
import { buildFlowInputs } from './modules/flavor/flavor_picker';
import { registerBuildRunner } from './modules/build_runner/build_runner';
import { ProgressStatus } from './models/dto/ProgressState';
import { IState } from './models/interfaces/IState';
import { FlavorStatusbarItem } from './modules/flavor/flavor_statusbar_item';
let flavorStatusBarItem: FlavorStatusbarItem | undefined;
let flavorConfig: WorkspaceConfigurator;
let flavorTask: ChangeFlavorTask;
let isGmaWorkspace: boolean = false;
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export function activate(context: vscode.ExtensionContext): void {
	
	isGmaWorkspace = vscode.workspace.workspaceFile?.path.endsWith('gma.code-workspace') ?? false;
	if (isGmaWorkspace) {
		console.log('Congratulations, your extension "GMA Studio" is now active!');

		flavorConfig = new WorkspaceConfigurator(context); 
		flavorConfig.onDidChanged((value) => {
			console.log(value);
			switch (value.status) {
				case ProgressStatus.loading:
					flavorStatusBarItem?.update({status: value.status});
					break;
				case ProgressStatus.failed:
					updateStatusBar(context);
					break;
				case ProgressStatus.success:
					updateStatusBar(context, value.value);
					break;
			}
		});
		registerWidgetCatalogPanel(context);
		registerDynamicFormPlaygroundPanel(context);
		registerBuildRunner(context);
		registerChangeFlavorMultiStep(context);
	} else {
		console.log('Cant use GMA Studio without correct gma.code-workspace.');
		flavorStatusBarItem?.hide();
	}

}

export function deactivate() {
	if (isGmaWorkspace === true) {
		flavorStatusBarItem?.dispose();
		console.log('Congratulations, your extension "GMA Studio" is now de-active!');
		flavorConfig.dispose();
		
	}
}

export async function registerWidgetCatalogPanel(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand(Constants.showWidgetCatalogCommandId, () => {
			if (WidgetCatalogPanel.currentPanel !== undefined) {
				WidgetCatalogPanel.currentPanel.doRefactor();
			}
			WidgetCatalogPanel.show(context.extensionUri);
		})
	);
	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(WidgetCatalogPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				webviewPanel.webview.options = WidgetCatalogPanel.getWebviewOptions(context.extensionUri);
				WidgetCatalogPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

export async function registerDynamicFormPlaygroundPanel(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand(Constants.showDynamicPlaygroundCatalogCommandId, () => {
			if (DynamicPlaygroundPanel.currentPanel) {
				DynamicPlaygroundPanel.currentPanel.doRefactor();
			}
			DynamicPlaygroundPanel.show(context.extensionUri);
		})
	);
	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(DynamicPlaygroundPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				webviewPanel.webview.options = DynamicPlaygroundPanel.getWebviewOptions(context.extensionUri);
				DynamicPlaygroundPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

export async function registerChangeFlavorMultiStep(context: vscode.ExtensionContext) {
	flavorStatusBarItem = FlavorStatusbarItem.register(context,()=> {
		console.log('flavorStatusBarItem clicked');
		changeFlavorFlow(context);
	});
	
	vscode.workspace.onDidChangeConfiguration((value) => {
		if (value.affectsConfiguration(Constants.gmaBuildSelectedApplication) || value.affectsConfiguration(Constants.gmaBuildSelectedCountry) || value.affectsConfiguration(Constants.gmaBuildSelectedStage)) {
			console.log(`value: ${value}`);
			updateStatusBar(context);
		}
	});
	updateStatusBar(context);
	let defaultState = await getDefaultState(context);
	runUpdateFlavor(defaultState);
}

async function getDefaultState(context: vscode.ExtensionContext) : Promise<IState> {
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
	flavorStatusBarItem?.update({state: defaultState, status: ProgressStatus.success});
 }