import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';
import { WorkspaceConfigurator } from '../configuration';
import { App, Country, Selectable, Stage } from '../models';

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
        app: App;
        stage: Stage;
        country: Country;

    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run(input => step1(input, state));
        return state as State;
    }

    const title = 'Choose application';

    async function step1(input: MultiStepInput, state: Partial<State>) {
        const items = await getItems<Country>(flavorConfig.countries);
        state.runtime = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 3,
            placeholder: 'Pick a country',
            items: items,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
        state.country = state.runtime as Country;
        return step2(input, state);
    }

    async function step2(input: MultiStepInput, state: Partial<State>) {
        const items = await getItems<App>(flavorConfig.apps);
        state.runtime = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 3,
            placeholder: 'Pick application',
            items: items,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
        state.app = state.runtime as App;
        return step3(input, state);
    }

    async function step3(input: MultiStepInput, state: Partial<State>) {
        const items = await getItems<Stage>(flavorConfig.stages);
        state.runtime = await input.showQuickPick({
            title,
            step: 3,
            totalSteps: 3,
            placeholder: 'Pick a flavor',
            items: items,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
        state.stage = state.runtime as Stage;
    }

    function shouldResume() {
        return new Promise<boolean>((resolve, reject) => {
            // noop
        });
    }

    async function getItems<T extends Selectable>(items: T[], token?: CancellationToken): Promise<QuickPickItem[]> {
        return items.map(value => ({
            key: value.key,
            label: value.label,
            detail: value.detail,
            picked: value.picked,
        }));
    }

    const state = await collectInputs();
    console.log(state);
    flavorConfig.setApp(state.app);
    flavorConfig.setCountry(state.country);
    flavorConfig.setStage(state.stage);
    flavorConfig.apply();
    window.showInformationMessage(`Picked app ${state.country.label} app ${state.app.label} in ${state.stage.label}`);
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
