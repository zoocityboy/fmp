import { IState, BuildFlow, Country, IQuickPickParameters, App, Stage } from '../../models';
import { WorkspaceConfigurator } from './worksapce_configurator';


export default async function buildFlowInputs(flavorConfig: WorkspaceConfigurator) {
    const title = 'Pick application variant';
    /** 
     * Collect all tesps for the build flow
     * 
     * you can pick a build flow from the list of build flows
     */
    async function collectInputs() {
        const state = {
            app: flavorConfig.getApp(),
            stage: flavorConfig.getStage(),
            country: flavorConfig.getCountry(),
            totalSteps: 3,
        } as Partial<IState>;
        await BuildFlow.run(input => pickCountry(input, state));
        return state as IState;
    }


    function shouldResume() {
        return new Promise<boolean>(() => {
            // noop
        });
    }

    /** 
     * Pick country
     * 
     * first step of the build flow
     */
    async function pickCountry(input: BuildFlow, state: Partial<IState>) {
        state.country = await input.showQuickPick<Country, IQuickPickParameters<Country>>({
            title,
            step: 1,
            totalSteps: 3,
            placeholder: 'Pick a country',
            items: flavorConfig.countries,
            activeItem: state.country,
            shouldResume: shouldResume,
        });
        return (input: BuildFlow) => pickApp(input, state);
    }

    /** 
     * Pick application
     * 
     * second step of the build flow
     */
    async function pickApp(input: BuildFlow, state: Partial<IState>) {
        state.app = await input.showQuickPick<App, IQuickPickParameters<App>>({
            title,
            step: 2,
            totalSteps: 3,
            placeholder: 'Pick application',
            items: flavorConfig.apps,
            activeItem: state.app,
            shouldResume: shouldResume,
        });

        return (input: BuildFlow) => pickStage(input, state);
    }

    /** 
     * Pick stage
     * 
     * last step of the build flow
     */
    async function pickStage(input: BuildFlow, state: Partial<IState>) {
        state.stage = await input.showQuickPick<Stage, IQuickPickParameters<Stage>>({
            title,
            step: 3,
            totalSteps: 3,
            placeholder: 'Pick a flavor',
            items: flavorConfig.stages,
            activeItem: state.stage,
            shouldResume: shouldResume,
        });
    }

    const state = await collectInputs();
    return state;
}
