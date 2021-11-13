import { QuickPickItem, window, CancellationToken, QuickInputButton, ExtensionContext, QuickInputButtons, Uri } from 'vscode';
import { WorkspaceConfigurator } from '../configuration';
import { IItem } from '../interfaces/ISelectable';
import { IState } from '../interfaces/IState';
import { App } from '../models/app';
import { Country } from '../models/country';
import { MultiStepInput } from '../models/MultiStepInput';
import { Stage } from '../models/stage';

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 * 
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function multiStepInput(context: ExtensionContext, flavorConfig: WorkspaceConfigurator) {

    class MyButton implements QuickInputButton {
        constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
    }

    

    async function collectInputs() {
        const state = {} as Partial<IState>;
        await MultiStepInput.run(input => step1(input, state));
        return state as IState;
    }

    const title = 'Choose application';

    async function step1(input: MultiStepInput, state: Partial<IState>) {
        let _country = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 3,
            placeholder: 'Pick a country',
            items: flavorConfig.countries,
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
        state.country = _country as Country;
        state.step = 1;
        return step2(input, state);
    }

    async function step2(input: MultiStepInput, state: Partial<IState>) {
        let _app = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 3,
            placeholder: 'Pick application',
            items: flavorConfig.apps,
            activeItem: state.runtime,
            shouldResume: shouldResume,
            buttons: [QuickInputButtons.Back]

        });
        state.app = _app as App;
        state.step = 2;
        return step3(input, state);
    }

    async function step3(input: MultiStepInput, state: Partial<IState>) {
        
        let _stage = await input.showQuickPick({
            title,
            step: 3,
            totalSteps: 3,
            placeholder: 'Pick a flavor',
            items: flavorConfig.stages,
            activeItem: state.runtime,
            shouldResume: shouldResume,
        });
        state.stage = _stage as Stage;
        state.step = 3;
    }

    function shouldResume() {
        return new Promise<boolean>((resolve, reject) => {
            // noop
        });
    }

    async function getItems<T extends IItem>(items: T[], token?: CancellationToken): Promise<QuickPickItem[]> {
        return items.map(value => ({
            key: value.key,
            label: value.labelWithIconPrefix,
            detail: value.detail,
            picked: value.picked,
        }));
    }

    const state = await collectInputs();
    console.log('FLAVOR PICKED');
    console.log(state);
    await flavorConfig.update(state.app, state.stage, state.country);
    window.showInformationMessage(`Picked app ${state.country.label} app ${state.app.label} in ${state.stage.label}`);
}