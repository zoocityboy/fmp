import { privateEncrypt } from 'crypto';
import path = require('path');
import { config } from 'process';
import * as vscode from 'vscode';
import { QuickInputButton, QuickPickItem, Uri } from 'vscode';
import { WorkspaceConfigurator } from './configuration';
import { FlavorTaskProvider } from './flavor_task_provider';
import * as models from './models';
import { ProgressState } from './models';
import { FlavorTasks } from './tasks';
let statusBarItem: vscode.StatusBarItem;
let configuration: vscode.WorkspaceConfiguration;
let flavorConfig: WorkspaceConfigurator;
let flaverTask: FlavorTasks;

let flavorTaskProvider: vscode.Disposable | undefined;
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

}

export function deactivate() {
	statusBarItem.hide();
}

export async function registerChangeFlavor(context: vscode.ExtensionContext) {
	const changeFlavorCommandId = 'kt.flavor.changeFlavor';
	const changeAppCommandId = 'kt.flavor.changeApp';
	const changeCountryCommandId = 'kt.flavor.changeCountry';
	const changeStageCommandId = 'kt.flavor.changeStage';
	let disposableCommand = vscode.commands.registerCommand(changeFlavorCommandId, () => {
		changeFlavroFlow();
	});

	vscode.commands.registerCommand(changeAppCommandId, () => {
		showSelect('Select app', flavorConfig.apps).then((value) => flavorConfig.apply());
	});
	vscode.commands.registerCommand(changeCountryCommandId, () => {
		showSelect('Select country', flavorConfig.countries).then((value) => flavorConfig.apply());
	});
	vscode.commands.registerCommand(changeStageCommandId, () => {
		showSelect('Select stage', flavorConfig.stages).then((value) => flavorConfig.apply());

	});

	context.subscriptions.push(disposableCommand);
	vscode.workspace.onDidChangeConfiguration((value) => {
		console.log(value.affectsConfiguration.name);
	});
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = changeFlavorCommandId;
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
export async function changeFlavroFlow() {
	await showSelect('Select country', flavorConfig.countries);
	await showSelect('Select app', flavorConfig.apps);
	await showSelect('Select stage', flavorConfig.stages);
	flavorConfig.apply();
	const shortTag = flavorConfig.getFlavorShortTag();
	if (shortTag) {
		flaverTask.changeFlavor(shortTag);
	}

	updateStatusBarItem();
}
async function updateStatusBarItem() {
	statusBarItem.text = '....';
	let app = flavorConfig.getApp();
	let stage = flavorConfig.getStage();
	let country = flavorConfig.getCountry();
	statusBarItem.text = `$(mark-github) ${country?.label ?? ''} ${app?.label ?? ''} app in ${stage?.label ?? ''}`;
	statusBarItem.show();

}
