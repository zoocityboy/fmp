import path = require('path');
import * as vscode from 'vscode';
import { WorkspaceConfigurator } from './configuration';
import { ProgressState } from './models';
import { FlavorTasks } from './tasks';
import { WidgetCatalogPanel } from './panel/widget_catalog_panel';
import { DynamicPlaygroundPanel } from './panel/dynamic_forms_panel';
import { Constants } from './constants';
import { NodeDependenciesProvider } from './panel/tree';
let statusBarItem: vscode.StatusBarItem;
let progressStatusBarItem: vscode.StatusBarItem;
let flavorConfig: WorkspaceConfigurator;
let flaverTask: FlavorTasks;

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

// function showMessageWithDelay(message: string, ms: number = 1500) {
// 	vscode.window.withProgress({
// 		location: vscode.ProgressLocation.Notification,
// 		title: message,
// 		cancellable: false
// 	}, async (progress, token) => {
// 		for (let i = 0; i < 50; ++i) {
// 			progress.report({ increment: 2 });
// 			await wait(ms / 100);
// 		}
// 	});

// }
export function activate(context: vscode.ExtensionContext) {

	flaverTask = new FlavorTasks();
	flaverTask.onDidChanged((value) => {
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
	flavorConfig = new WorkspaceConfigurator();
	flavorConfig.onDidChanged((value) => {
		console.log(value);
		if (value.state === ProgressState.complete) {
			updateStatusBarItem();
		}

	});
	registerChangeFlavor(context);
	registerWidgetCatalogPanel(context);
	registerDynamicFormPlaygroundPanel(context);
}
export function deactivate() {
	statusBarItem.hide();
	progressStatusBarItem.hide();
}
export async function registerWidgetCatalogPanel(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(Constants.showWidgetCatalogCommandId, () => {
			WidgetCatalogPanel.show(context.extensionUri);
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('catCoding.doRefactor', () => {
			if (WidgetCatalogPanel.currentPanel) {
				WidgetCatalogPanel.currentPanel.doRefactor();
			}
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
			DynamicPlaygroundPanel.show(context.extensionUri);
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('catCoding.doRefactor', () => {
			if (DynamicPlaygroundPanel.currentPanel) {
				DynamicPlaygroundPanel.currentPanel.doRefactor();
			}
		})
	);
	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(DynamicPlaygroundPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				webviewPanel.webview.options = DynamicPlaygroundPanel.getWebviewOptions(context.extensionUri);
				DynamicPlaygroundPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}


export async function registerTreePanel(context: vscode.ExtensionContext) {
	const folder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.applicationFolder)!;
	vscode.window.registerTreeDataProvider(
		'nodeDependencies',
		new NodeDependenciesProvider(folder?.uri.path)
	);
}

export async function registerChangeFlavor(context: vscode.ExtensionContext) {

	let disposableCommand = vscode.commands.registerCommand(Constants.changeFlavorCommandId, () => {
		changeFlavorFlow();
	});

	vscode.commands.registerCommand(Constants.changeAppCommandId, () => {
		showSelect('Select app', flavorConfig.apps).then((value) => flavorConfig.apply());
	});
	vscode.commands.registerCommand(Constants.changeCountryCommandId, () => {
		showSelect('Select country', flavorConfig.countries).then((value) => flavorConfig.apply());
	});
	vscode.commands.registerCommand(Constants.changeStageCommandId, () => {
		showSelect('Select stage', flavorConfig.stages).then((value) => flavorConfig.apply());

	});

	context.subscriptions.push(disposableCommand);
	vscode.workspace.onDidChangeConfiguration((value) => {
		console.log(value.affectsConfiguration.name);
	});
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = Constants.changeFlavorCommandId;

	progressStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);

	flavorConfig.apply();
}

export async function showSelect<T extends vscode.QuickPickItem>(placeholder: string, items: T[]): Promise<T | undefined> {
	return vscode.window.showQuickPick(items, {
		placeHolder: placeholder,
		onDidSelectItem: item => {
			var _item: vscode.QuickPickItem = item as vscode.QuickPickItem;
			items.forEach((value) => {
				value.picked = value.label === _item.label;
			});
		}
	});
}
export async function changeFlavorFlow() {
	await showSelect('Select country', flavorConfig.countries);
	await showSelect('Select app', flavorConfig.apps);
	await showSelect('Select stage', flavorConfig.stages);
	await flavorConfig.apply();
	const shortTag = flavorConfig.getFlavorShortTag();
	const app = flavorConfig.getApp();
	if (shortTag !== undefined && app !== undefined) {
		updateProgressStatusBarItem(ProgressState.loading, "Change flavor started.");
		flaverTask.changeFlavor(shortTag, app.key);
	}
}
async function updateStatusBarItem() {
	statusBarItem.text = '....';
	let app = flavorConfig.getApp();
	let stage = flavorConfig.getStage();
	let country = flavorConfig.getCountry();
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
			});
			break;
	}
}