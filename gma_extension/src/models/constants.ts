import { Stage,IState, App } from ".";

/**
 * Set of constants used by the extensions.
 * 
 */
export class Constants {
    //#region  Structure
    static hideAfterDelay = 3000; // in milliseconds
    static gmaIsWorkspaceAvailable = 'gma.workspace.available';
    /// Static files required for the app to run
    static workspaceFileName = 'gma.code-workspace';
    static workspaceGmaYaml = 'gma.yaml';
    
    /// Folders
    static pluginsFolder = "Plugins";
    static packagesFolder = "Packages";
    static applicationFolder = "Application";
    static rootFolder = "Root";
    //#endregion
    
    //#region  Commands
    // Commands
    static changeAppCommandId = 'gma.commands.changeApp';
    static gmaCommandUpdateStudio = 'gma.commands.update.studio';

    /// Workspace
    static gmaCommandWorkspaceSave = 'gma.commands.workspace.save';
    static gmaCommandWorkspaceRestore = 'gma.commands.workspace.restore';
    
    /// Explorer
    static gmaCommandExplorerAddToFolders = 'gma.commands.explorer.addToFolders';
    static gmaCommandExplorerAddRootToFolders = 'gma.commands.explorer.addRootToFolders';
    static gmaCommandExplorerOpenFile = 'gma.commands.explorer.openFile';
    static gmaCommandExplorerRefresh = 'gma.commands.explorer.refresh';
    static gmaCommandExplorerPluginsRefresh = 'gma.commands.explorer.plugins.refresh';
    static gmaCommandExplorerProjectRefresh = 'gma.commands.explorer.project.refresh';
    static gmaCommandExplorerCollapse = 'gma.commands.explorer.collapse';

    /// Runners
    static gmaCommandPicker = 'gma.commands.commandRunner';
    
    /// Build runner
    static gmaCommandBuildRunnerBuild = 'gma.commands.buildRunner.build';
    static gmaCommandBuildRunnerWatch = 'gma.commands.buildRunner.watch';
    static gmaCommandBuildRunnerTerminate = 'gma.commands.buildRunner.terminate';
    
    /// Server
    static gmaCommandServerShow = 'gma.commands.server.show';
    static gmaCommandServerStart = 'gma.commands.server.start';
    static gmaCommandServerStop = 'gma.commands.server.stop';
    //#endregion

    //#region  Flavor
    /// Standard config keys
    static gmaHelpQuicklinksView = 'gma:views:help';
    static gmaCiCdView = 'gma:views:cicd';
    static gmaDocumentationView = 'gma:views:documentation';
    static gmaProjectView = 'gma:views:project';
    static gmaServersView = 'gma:views:servers';
    static gmaPluginsView = 'gma:views:plugins';
    static gmaBuildRunnerView = 'gma:views:buildrunner';

    /// Predefined Build Targets
    static defaultAppKey = "self_care";
    static defaultStageKey = "prod";
    static defaultCountryKey = "in";

    /// Build Configuration
    static gmaSelectedApplication = "selectedApplication";
    static gmaSelectedCountry = "selectedCountry";
    static gmaSelectedStage = "selectedStage";
    //#endregion

    //#region  Helpers
    static gmaConfigWorkspaceFoldersAdd = "gma.workspaceFolders.add";
    static gmaConfigWorkspaceFoldersIgnore = "gma.workspaceFolders.ignore";
    ///
    static gmaConfigCustomWorkspaceFolders = "gma.custom.workspaceFolders";
    static gmaConfigBuildSelectedApplication = 'gma.build.selectedApplication';
    static gmaConfigBuildSelectedCountry = 'gma.build.selectedCountry';
    static gmaConfigBuildSelectedStage = 'gma.build.selectedStage';
    //#endregion

    //#region Glob patterns
    /// Standard config keys
    static settingsLaunchConfigurations = 'launch.configurations';
    static settingsFilesExclude = 'files.exclude';
    static launcherProgram(stage: Stage) {
        return `lib/main_${stage.key}.dart`;
    }

    static launcherArgs(state: IState) {
        const shortTag = `${state.stage?.key}${state.country?.key}`;
        return ["--flavor", shortTag];
    }

   /**
     * Prepare glob pattern for packages from selected app
     * 
     * @param app 
     * @returns full glob pattern
     */
    static gmaGlobPatternPackages(app: App): string {
        const exclude: string[] = [];
        const excludeData: Map<string,boolean> = app.exclude ?? new Map<string,boolean>();
        
        excludeData.forEach((value, key) => {
            if (value) {
                exclude.push(`!${key}`);
            }
        });
        exclude.push(`!.DS_Store`);
        const packagePattern = exclude.join(',');
        const fullPattern = `packages/[${packagePattern}]*/`;
        return fullPattern;
    }
    static gmaGlobPatternDocumentation = '*(docs|capp|mapp|plugins)/!(build)/*.{md,MD}';
    static gmaGlobPatternPipelines = '**!(dynamic_forms)/!(pubspec*|analysis_options|build).{yml,yaml}';
    static gmaGlobPatternToolingFiles = '**/studio-*.vsix';
    //#endregion

    //#region Server
    static gmaServerStart = 'gma.start';
    static gmaServerStop = 'gma.stop';
    static gmaServerRunning = 'gma-server-running';
    static gmaStopedRunning = 'gma-server-stopped';

    static gmaServerName = 'vschttpd';
    //#endregion
}