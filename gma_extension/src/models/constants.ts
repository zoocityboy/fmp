import { Stage,IState } from ".";


export class Constants {
    /// Static files required for the app to run
    static workspaceFileName: string = 'gma.code-workspace';
    static workspaceGmaYaml: string = 'gma.yaml';
    
    /// Folders
    static pluginsFolder: string = "Plugins";
    static packagesFolder: string = "Packages";
    static applicationFolder: string = "Application";
    static rootFolder: string = "Root";
    
    // Commands
    static changeAppCommandId: string = 'gma.commands.changeApp';
    
    /// Explorer
    static gmaCommandExplorerAddToFolders: string = 'gma.commands.explorer.addToFolders';
    static gmaCommandExplorerAddRootToFolders: string = 'gma.commands.explorer.addRootToFolders';
    static gmaCommandExplorerOpenFile: string = 'gma.commands.explorer.openFile';
    static gmaCommandExplorerRefresh: string = 'gma.commands.explorer.refresh';
    static gmaCommandExplorerCollapse: string = 'gma.commands.explorer.collapse';

    /// Runners
    static gmaCommandPicker: string = 'gma.commands.commandRunner';
    
    /// Build runner
    static gmaCommandBuildRunnerBuild: string = 'gma.commands.buildRunner.build';
    static gmaCommandBuildRunnerWatch: string = 'gma.commands.buildRunner.watch';
    static gmaCommandBuildRunnerTerminate: string = 'gma.commands.buildRunner.terminate';
    
    /// Server
    static gmaCommandServerStart: string = 'gma.commands.server.start';
    static gmaCommandServerStop: string = 'gma.commands.server.stop';

    /// Standard config keys
    static gmaHelpQuicklinksView: string = 'gma:views:help';
    static gmaCiCdView: string = 'gma:views:cicd';
    static gmaDocumentationView: string = 'gma:views:documentation';
    static gmaProjectView: string = 'gma:views:project';
    static gmaServersView: string = 'gma:views:servers';
    static gmaPluginsView: string = 'gma:views:plugins';
    static gmaBuildRunnerView: string = 'gma:views:buildrunner';

    /// Predefined Build Targets
    static defaultAppKey: string = "self_care";
    static defaultStageKey : string= "prod";
    static defaultCountryKey: string = "in";

    /// Build Configuration
    static gmatBuildSection: string = "gma.build";
    static gmaSelectedApplication: string = "selectedApplication";
    static gmaSelectedCountry: string = "selectedCountry";
    static gmaSelectedStage: string = "selectedStage";

    ///
    static gmaConfigCustomWorkspaceFolders: string = "gma.custom.workspaceFolders";
    static gmaConfigBuildSelectedApplication: string = 'gma.build.selectedApplication';
    static gmaConfigBuildSelectedCountry: string = 'gma.build.selectedCountry';
    static gmaConfigBuildSelectedStage: string = 'gma.build.selectedStage';

    /// Standard config keys
    static settingsLaunchConfigurations: string = 'launch.configurations';
    static settingsFilesExclude: string = 'files.exclude';
    static launcherProgram(stage: Stage) {
        return `lib/main_${stage.key}.dart`;
    }

    static launcherArgs(state: IState) {
        let shortTag: string = `${state.stage?.key}${state.country?.key}`;
        return ["--flavor", shortTag];
    }

    /// Glob patterns
    static gmaGlobPatternDocumentation: string = '*(docs|capp|mapp|plugins)/**/*.{md,MD}';
    static gmaGlobPatternPipelines: string = '**!(dynamic_forms)/!(pubspec*|analysis_options|build).{yml,yaml}';
}