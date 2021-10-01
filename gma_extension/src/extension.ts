import path = require('path');
import * as vscode from 'vscode';
import { WorkspaceConfigurator } from './configuration';
import { ProgressState } from './models';
import { FlavorTasks } from './tasks';
import { BoardPanel } from './panel/board_panel';
import { Constants } from './constants';
import { NodeDependenciesProvider } from './panel/tree';
let statusBarItem: vscode.StatusBarItem;
let flavorConfig: WorkspaceConfigurator;
let flaverTask: FlavorTasks;

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

function showMessageWithDelay(message: string, ms: number = 1500) {
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: message,
		cancellable: false
	}, async (progress, token) => {
		for (let i = 0; i < 50; ++i) {
			progress.report({ increment: 2 });
			await wait(ms / 100);
		}
	});
}
export function activate(context: vscode.ExtensionContext) {

	flaverTask = new FlavorTasks();
	flaverTask.onDidChanged((value) => {
		console.log(`FlavorTasks: ${value.message} ${value.state} ${value.failed}`);
		switch (value.state) {
			case ProgressState.loading:
				showMessageWithDelay(value.message ?? 'Building flavor...', 5000);

				break;
			case ProgressState.complete:
				if (value.failed) {
					vscode.window.showErrorMessage(value.failed.message);
				} else {
					// vscode.window.showInformationMessage(value.message ?? 'Build flavor finished', {
					// 	modal: false,
					// } as vscode.MessageOptions, "Okey").then((value) => { });
					showMessageWithDelay(value.message ?? 'Build flavor finished', 2500);

				}

				break;
			default:
				vscode.window.showInformationMessage(`${value.message}`);
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
	registerBoardPanel(context);
}
export function deactivate() {
	statusBarItem.hide();
}
export async function registerBoardPanel(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(Constants.showBoardCommandId, () => {
			BoardPanel.show(context.extensionUri);
		})
	);
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
		flaverTask.changeFlavor(shortTag, app.key);
	}
	updateStatusBarItem();


}
async function updateStatusBarItem() {
	statusBarItem.text = '....';
	let app = flavorConfig.getApp();
	let stage = flavorConfig.getStage();
	let country = flavorConfig.getCountry();
	statusBarItem.text = `$(notebook-execute) ${country?.label ?? ''} ${app?.label ?? ''} app in ${stage?.label ?? ''}`;
	statusBarItem.show();

}
