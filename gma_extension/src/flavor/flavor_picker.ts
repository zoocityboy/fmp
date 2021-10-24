/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';
import { WorkspaceConfigurator } from '../configuration';
import * as vscode from 'vscode';
/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 * 
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function multiStepInput(context: ExtensionContext, flavorConfig: WorkspaceConfigurator) {

    class MyButton implements QuickInputButton {
        constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
    }

    const createResourceGroupButton = new MyButton({
        dark: Uri.file(context.asAbsolutePath('media/dark/add.svg')),
        light: Uri.file(context.asAbsolutePath('media/light/add.svg')),
    }, 'Change flavor group');

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        resourceGroup: QuickPickItem | string;
        name: string;
        runtime: QuickPickItem;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run(input => step1(input, state));
        return state as State;
    }

    const title = 'Choose application';

    async function step1(input: MultiStepInput, state: Partial<State>) {
        const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        const runtimes = await getAvailableRuntimes(state.resourceGroup!, undefined /* TODO: token */);
        // TODO: Remember currently active item when navigating back.
        state.runtime = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 3,
            placeholder: 'Pick a country',
            items: runtimes,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
    }

    async function step2(input: MultiStepInput, state: Partial<State>) {
        const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        const runtimes = await getAvailableRuntimes(state.resourceGroup!, undefined /* TODO: token */);
        // TODO: Remember currently active item when navigating back.
        state.runtime = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 3,
            placeholder: 'Pick a stage',
            items: runtimes,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
    }

    async function step3(input: MultiStepInput, state: Partial<State>) {
        const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        const runtimes = await getAvailableRuntimes(state.resourceGroup!, undefined /* TODO: token */);
        // TODO: Remember currently active item when navigating back.
        state.runtime = await input.showQuickPick({
            title,
            step: 3,
            totalSteps: 3,
            placeholder: 'Pick a flavor',
            items: runtimes,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
    }

    async function pickRuntime(input: MultiStepInput, state: Partial<State>) {
        const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        const runtimes = await getAvailableRuntimes(state.resourceGroup!, undefined /* TODO: token */);
        // TODO: Remember currently active item when navigating back.
        state.runtime = await input.showQuickPick({
            title,
            step: 3 + additionalSteps,
            totalSteps: 3 + additionalSteps,
            placeholder: 'Pick a runtime',
            items: runtimes,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
    }
    async function pickApp(input: MultiStepInput, state: Partial<State>) {
        const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        const runtimes = await getAvailableRuntimes(state.resourceGroup!, undefined /* TODO: token */);
        // TODO: Remember currently active item when navigating back.
        state.runtime = await input.showQuickPick({
            title,
            step: 3 + additionalSteps,
            totalSteps: 3 + additionalSteps,
            placeholder: 'Pick a runtime',
            items: runtimes,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
    }

    async function showSelect<T extends vscode.QuickPickItem>(placeholder: string, items: T[]): Promise<T | undefined> {
        return vscode.window.showQuickPick(items, {
            placeHolder: placeholder,
            onDidSelectItem: item => {
                const _item: vscode.QuickPickItem = item as vscode.QuickPickItem;
                items.forEach((value) => {
                    value.picked = value.label === _item.label;
                });
            }
        });
    }

    function shouldResume() {
        // Could show a notification with the option to resume.
        return new Promise<boolean>((resolve, reject) => {
            // noop
        });
    }

    async function validateNameIsUnique(name: string) {
        // ...validate...
        await new Promise(resolve => setTimeout(resolve, 1000));
        return name === 'vscode' ? 'Name not unique' : undefined;
    }

    async function getAvailableRuntimes(resourceGroup: QuickPickItem | string, token?: CancellationToken): Promise<QuickPickItem[]> {
        // ...retrieve...
        // await new Promise(resolve => setTimeout(resolve, 1000));
        return flavorConfig.countries.map(value => ({
            label: value.label,
            description: value.label,
            detail: value.label,
            picked: value.picked,
            alwaysShow: true,
        }));
        // return ['Node 8.9', 'Node 6.11', 'Node 4.5']
        //     .map(label => ({ label }));
    }

    const state = await collectInputs();
    window.showInformationMessage(`Picked app '${state.name}'`);
}


// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------


class InputFlowAction {
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    placeholder: string;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

    static async run<T>(start: InputStep) {
        const input = new MultiStepInput();
        return input.stepThrough(start);
    }

    private current?: QuickInput;
    private steps: InputStep[] = [];

    private async stepThrough<T>(start: InputStep) {
        let step: InputStep | void = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                } else if (err === InputFlowAction.cancel) {
                    step = undefined;
                } else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }

    async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
                if (activeItem) {
                    input.activeItems = [activeItem];
                }
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidChangeSelection(items => resolve(items[0])),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                        })()
                            .catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }

}
