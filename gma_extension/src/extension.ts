import * as vscode from 'vscode';
import { WorkspaceConfigurator } from './configuration';
import { ProgressState } from './models';
import { FlavorTasks } from './tasks';
import { WidgetCatalogPanel } from './panel/widget_catalog_panel';
import { DynamicPlaygroundPanel } from './panel/dynamic_forms_panel';
import { Constants } from './constants';
import { multiStepInput } from './flavor/flavor_picker';
import { registerBuildRunner } from './build_runner/build_runner';
let statusBarItem: vscode.StatusBarItem;
let progressStatusBarItem: vscode.StatusBarItem;
let flavorConfig: WorkspaceConfigurator;
let flavorTask: FlavorTasks;
let isGmaWorkspace: boolean = false;
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export function activate(context: vscode.ExtensionContext) {
	isGmaWorkspace = vscode.workspace.workspaceFile?.path.endsWith('gma.code-workspace') ?? false;
	if (isGmaWorkspace) {
		console.log('Congratulations, your extension "GMA Studio" is now active!');
		flavorConfig = new WorkspaceConfigurator();
		flavorTask = new FlavorTasks();
		flavorTask.onDidChanged((value) => {
			console.log(`FlavorTasks: ${value.message} ${value.state} ${value.failed}`);
			switch (value.state) {
				case ProgressState.loading:
					updateProgressStatusBarItem(value.state, value.message ?? 'Building flavor...');

					break;
				case ProgressState.complete:
					if (value.failed) {
						updateProgressStatusBarItem(value.state, value.failed.message ?? 'Error...');
					} else {
						updateProgressStatusBarItem(value.state, value.message ?? 'Building flavor...');
					}

					break;
				default:
					updateProgressStatusBarItem(value.state, value.message ?? 'Building flavor...');
					break;
			}
		});

		flavorTask.rootWorkspaceFolder = flavorConfig.rootWorkspaceFolder;
		flavorConfig.onDidChanged((value) => {
			console.log(value);
			if (value.state === ProgressState.complete) {
				updateStatusBarItem();
			}
		});

		registerWidgetCatalogPanel(context);
		registerDynamicFormPlaygroundPanel(context);
		registerBuildRunner(context);
		registerChangeFlavorMultiStep(context);
	} else {
		console.log('Cant use GMA Studio without correct gma.code-workspace.');
		statusBarItem.hide();
		progressStatusBarItem.hide();
	}

}

export function deactivate() {
	if (isGmaWorkspace === true) {
		console.log('Congratulations, your extension "GMA Studio" is now de-active!');
		flavorConfig.dispose();
		statusBarItem.hide();
		progressStatusBarItem.hide();
	} else {

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
	const disposableCommand = vscode.commands.registerCommand(Constants.changeFlavorCommandId, () => {
		changeFlavorFlow(context);
	});

	context.subscriptions.push(disposableCommand);
	vscode.workspace.onDidChangeConfiguration((value) => {
		console.log(value.affectsConfiguration.name);
		// flavorConfig.reload();
		// updateStatusBarItem();
	});
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = Constants.changeFlavorCommandId;

	progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);

	flavorConfig.apply();
	await runUpdateFlavor(context, false);
}

export async function changeFlavorFlow(context: vscode.ExtensionContext) {
	await multiStepInput(context, flavorConfig);
	await runUpdateFlavor(context, false);
}

export async function runUpdateFlavor(context: vscode.ExtensionContext, force: boolean | undefined) {
	const shortTag = flavorConfig.getFlavorShortTag();
	const app = flavorConfig.getApp();
	if (shortTag !== undefined && app !== undefined) {
		updateProgressStatusBarItem(ProgressState.loading, "Change flavor started.");
		flavorTask.changeFlavor(shortTag, app.key, force);
	}
}

async function updateStatusBarItem() {
	statusBarItem.text = '....';
	const app = flavorConfig.getApp();
	const stage = flavorConfig.getStage();
	const country = flavorConfig.getCountry();
	console.log(`updateStatusBarItem: $(globe~spin) ${country?.label ?? ''} ${app?.label ?? ''} app in ${stage?.label ?? ''}`);
	statusBarItem.text = `$(globe~spin) ${country?.label ?? ''} ${app?.label ?? ''} app in ${stage?.label ?? ''}`;
	statusBarItem.show();

}

async function updateProgressStatusBarItem(state: ProgressState, message: string) {

	switch (state) {
		case ProgressState.default:

			break;
		case ProgressState.loading:
			statusBarItem.text = `$(sync~spin) ${message}`;
			break;
		case ProgressState.complete:
			statusBarItem.text = `$(sync~spin) ${message}`;
			wait(3000).then(() => {
				updateStatusBarItem();
				// vscode.commands.executeCommand('dart.restartAnalysisServer');
			});
			break;
	}
}