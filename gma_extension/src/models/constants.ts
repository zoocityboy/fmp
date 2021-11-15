import { Stage } from "./dto/stage";
import { IState } from "./interfaces/IState";


export class Constants {
    static pluginsFolder: String = "Plugins";
    static packagesFolder: String = "Packages";

    static applicationFolder: string = "Application";
    static rootFolder: string = "Root";
    static configKeyFlavor: string = "gma.flavor";
    static configKeyApps: string = "gma.flavor.apps";
    static configKeyCountries: string = "gma.flavor.countries";
    static configKeyStages: string = "gma.flavor.stages";

    static changeFlavorCommandId = 'gma.flavor.changeFlavor';
    static changeAppCommandId = 'gma.flavor.changeApp';
    static changeCountryCommandId = 'gma.flavor.changeCountry';
    static changeStageCommandId = 'gma.flavor.changeStage';

    static configWidgetCatalog = 'gma.flavor.widget_catalog';
    static showWidgetCatalogCommandId = 'gma.flavor.showCatalog';

    static configDynamicFormsPlayground = 'gma.flavor.dynamic_forms_playground';
    static showDynamicPlaygroundCatalogCommandId = 'gma.flavor.showDynamicFormsPlayground';

    /// Predefined Build Targets
    static defaultAppKey = "self_care";
    static defaultStageKey = "prod";
    static defaultCountryKey = "in";

    /// Build Configuration
    static gmaBuildSelectedApplication = 'gma.build.selectedApplication';
    static gmaBuildSelectedCountry = 'gma.build.selectedCountry';
    static gmaBuildSelectedStage = 'gma.build.selectedStage';
    /// Standard config keys
    static settingsLaunchConfigurations = 'launch.configurations';
    static settingsFilesExclude = 'files.exclude';
    static launcherProgram(stage: Stage) {
        return `lib/main_${stage.key}.dart`;
    }
    static launcherArgs(state: IState) {
        let shortTag: string = `${state.stage?.key}${state.country?.key}`;
        return ["--flavor", shortTag];
    }


}