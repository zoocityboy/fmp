import * as vscode from 'vscode';
import * as path from 'path';
import { IMessageEvent, App, Constants, listOfApps, Stage, listOfStages, Country, listOfCountries, ProgressStatus, IState, ILaunchConfiguration } from '../../models';
import { Process } from '../../core';
import { GmaConfig } from './workspace_config';
import { UiProgress } from '../../core/progress';
import { wait } from '../../extension';
import { GlobSync } from 'glob';
import { IFolder } from '../../models/interfaces/i_folder';
import { sortFolders } from '../../core/arrays';

/**
 * Configuration class which works over the current Workspace
 * 
 */
export class WorkspaceConfigurator {
    private target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace;
    private userTarget: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;
    private configuration: vscode.WorkspaceConfiguration;
    private workspaceWatcher: vscode.FileSystemWatcher | undefined;
    public isChangeTriggerFromExtension = false;
    private _onDidChanged: vscode.EventEmitter<IMessageEvent>;

    public apps: App[] = listOfApps;
    public stages: Stage[] = listOfStages;
    public countries: Country[] = listOfCountries;

    private waitForWorkspaceUpdate = false;

    public getApp(): App {
        const _key = vscode.workspace.getConfiguration().get<string>(Constants.gmaConfigBuildSelectedApplication);
        return App.fromKey(_key ?? Constants.defaultAppKey);
    }
    

    public getCountry(): Country {
        const _key = vscode.workspace.getConfiguration().get<string>(Constants.gmaConfigBuildSelectedCountry);
        return Country.fromKey(_key ?? Constants.defaultCountryKey);
    }

    public getStage(): Stage {
        const _key = vscode.workspace.getConfiguration().get<string>(Constants.gmaConfigBuildSelectedStage);
        return Stage.fromKey(_key ?? Constants.defaultStageKey);
    }

    constructor(context: vscode.ExtensionContext) {
        this.configuration = vscode.workspace.getConfiguration();
        this._onDidChanged = new vscode.EventEmitter<IMessageEvent>();
        context.subscriptions.push(
            vscode.commands.registerCommand(Constants.gmaCommandOpenSettings, () => {
                void vscode.commands.executeCommand(Constants.vscodeCommandOpenSettings, `@ext:${Constants.extensionName}`);
            }),
            vscode.commands.registerCommand(Constants.gmaCommandCreatePackage, () => {
                void vscode.commands.executeCommand(Constants.vscodeCommandCreateDartProject);
            }),
            vscode.commands.registerCommand(Constants.gmaCommandWorkspaceSave, () => {
                void this.saveAppWorkspace();
            }),
            vscode.commands.registerCommand(Constants.gmaCommandWorkspaceRestore, () => {
                void this.restoreAppWorkspace();
            }),
            vscode.commands.registerCommand(Constants.gmaCommandWorkspaceLoadSaved, () => {
                void this.loadAppWorkspace();
            }),
            vscode.commands.registerCommand(Constants.gmaCommandWorkspaceUseCustom, async (value) => {
                await vscode.workspace.getConfiguration().update(Constants.gmaConfigWorkspaceUseCustom, value, this.target);
                
            }),
            vscode.workspace.onDidChangeWorkspaceFolders((e) => this.updateWorkspaceFolders(e)),
            // vscode.workspace.onDidChangeConfiguration((e) => this.updateWorkspaceConfig(e)),
        );
        this.loadConfiguration();
        this.runWatcher();
    }

    private loadConfiguration(){
        this.apps = GmaConfig.i.appAsModelApp ?? listOfApps;
        const folders = vscode.workspace.workspaceFolders??[]
        if (folders.length === 0) {
            this.packages(this.getApp());
        } 
    }

    private async updateWorkspaceConfig(event: vscode.ConfigurationChangeEvent) {
       
        if (event.affectsConfiguration(Constants.gmaConfigWorkspaceUseCustom)) {
            const value = vscode.workspace.getConfiguration().get<boolean>(Constants.gmaConfigWorkspaceUseCustom, false);
            console.log(`workspace config changed ${value}`);
        }
        if (event.affectsConfiguration(Constants.gmaConfigBuildSelectedApplication)) {
            //
        }
        await wait(100);
        this.message({
            status: ProgressStatus.success,
        });
    }

    /**
     * Function triggred by the workspace change event
     * @param e 
     */
    private async updateWorkspaceFolders(e: vscode.WorkspaceFoldersChangeEvent): Promise<void>{
            console.log(`workspace folder changed added: ${e.added.length} remove: ${e.removed.length} ->  ${this.isChangeTriggerFromExtension}s `);
        if (!this.isChangeTriggerFromExtension) {
            if (e.added.length > 0) {
               await this.folderAdded(e.added as vscode.WorkspaceFolder[]);
            }
            if (e.removed.length > 0) {
                await this.folderRemoved(e.removed as vscode.WorkspaceFolder[]);
            }
        }
        this.waitForWorkspaceUpdate = false;
    }
   
    get onDidChanged(): vscode.Event<IMessageEvent> {
        return this._onDidChanged.event;
    }

    private runWatcher() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const pattern = new vscode.RelativePattern(GmaConfig.i.workspaceDirFsPath, Constants.workspaceFileName);
        this.workspaceWatcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);
        this.workspaceWatcher.onDidChange(async ()=> {
            console.log('workspace file changed');
            if (!this.isChangeTriggerFromExtension) {
                await wait(1000)
                this.reload();
                this.message({ message: "success", status: ProgressStatus.success });
                void UiProgress.instance.hideAfterDelay('runwatcher','Workspace was changed outside GMA Studio');
            }
            this.waitForWorkspaceUpdate = false;
        });
    }

    public reload() {
        this.configuration = vscode.workspace.getConfiguration();
        void vscode.commands.executeCommand(Constants.vscodeCommandRefreshFileExplorer);
    }

    public dispose() {
        this.workspaceWatcher?.dispose();
    }

    /**
     * Trigger start of the change flavor task
     * 
     * @param state selected value from multi-select
     */
    public runCommand(state: IState) {
        if (this.waitForWorkspaceUpdate){
            void UiProgress.instance.hideAfterDelay('update','Please wait for workspace update');
            return;
        }
        this.waitForWorkspaceUpdate = true;
        this.isChangeTriggerFromExtension = true;
        Process.instance.runChangeFlavor(state).then( async (status) => {
            console.log(`Change flavor: progress status: ${status}`);
            if (status === ProgressStatus.success) {
                await this.updateWorkspace(state);
                this.message({ message: "Change flavor success.", status: ProgressStatus.success, value: state});
                this.isChangeTriggerFromExtension = false;
            }
        }).catch((err) => {
            this.message({ message: `${err}`, status: ProgressStatus.failed });
            
        }).finally(() => {
            void this.checkOwnWorkspace()
            this.waitForWorkspaceUpdate = false;
        });
       
        
        
    }

    /**
     * Update the workspace configuration with the new values
     * and add the new values to persistant storage
     * 
     * @param folders 
     */
    public async folderAdded(folders: vscode.WorkspaceFolder[]) {
        if (!GmaConfig.i.isEnabledAddingToCustomFolders) return;

        const items = this.configuration.get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
        const newItems = folders.map((value) => value.uri);
        newItems.forEach((value) => {
            const relative = path.relative(GmaConfig.i.workspaceDirFsPath, value.fsPath);
            if (!items.includes(relative) && relative.length > 0) {
                items.push(relative);
            }
        });
        await this.configuration.update(Constants.gmaConfigCustomWorkspaceFolders, items, this.target);
        GmaConfig.i.disableAddingToCustomFolders();
    }

    /**
     * Update the workspace configuration with the new values
     * and remove the old values from persistant storage
     * 
     * @param folders 
     */
    private async folderRemoved(folders: vscode.WorkspaceFolder[]) {
        const items = this.configuration.get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
        const newItems = folders.map((value) => value.uri);
        newItems.forEach((value) => {
            const relative = path.relative(GmaConfig.i.workspaceDirFsPath, value.fsPath);
            const index = items.indexOf(relative);
            if (index > -1) {
                items.splice(index, 1);
            }
        });
        await this.configuration.update(Constants.gmaConfigCustomWorkspaceFolders, items, this.target);
    }

    /**
     * Update Workspace
     * - save workspace changes from selected *IState*
     * @param state 
     */
    public async updateWorkspace(state: IState): Promise<void> {

        const appInspector = this.configuration.inspect<string>(Constants.gmaConfigBuildSelectedApplication);
        const countryInspector = this.configuration.inspect<string>(Constants.gmaConfigBuildSelectedCountry);
        const stageInspector = this.configuration.inspect<string>(Constants.gmaConfigBuildSelectedStage);

        const updatedAppValue = state.app?.key ?? appInspector?.defaultValue ?? Constants.defaultAppKey;
        await this.configuration.update(Constants.gmaConfigBuildSelectedApplication, updatedAppValue , this.target);

        const updatedCountryValue = state.country?.key ?? countryInspector?.defaultValue ?? Constants.defaultCountryKey;
        await this.configuration.update(Constants.gmaConfigBuildSelectedCountry, updatedCountryValue, this.target);

        const updatedStageValue = state.stage?.key ?? stageInspector?.defaultValue ?? Constants.defaultStageKey;
        await this.configuration.update(Constants.gmaConfigBuildSelectedStage, updatedStageValue, this.target);

        const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
        await wait(100);
        await this.updateLauncher(state);
        this.packages(state.app);
        await wait(100);
        this.reload();
        return;
    }

    /**
     * Update launcher settings with selected app
     */
    private async updateLauncher(state: IState) {
        if (state.stage === undefined || state.country === undefined) { return; }
        const shortTag: string | undefined = `${state.stage.key}${state.country.key}`;
        if (!state.stage || !shortTag) {
            return;
        }
        const launchers: ILaunchConfiguration[] | undefined = this.configuration.get<ILaunchConfiguration[]>(Constants.settingsLaunchConfigurations, []);
        const program = Constants.launcherProgram(state.stage);
        const args = Constants.launcherArgs(state);

        launchers.forEach((value) => {
            try{
                value.args = args;
                value.program = program;
                const _path = path.join(GmaConfig.i.workspaceDirFsPath, state.app?.folder ?? '');
                value.cwd = _path;
            } catch (err) {
                console.log(err);
            }
        });
        await vscode.workspace.getConfiguration().update(Constants.settingsLaunchConfigurations, launchers, this.target);

    }


    /**
     * Update workspace with selected packages from selected app
     * will exclude packages defined in gma.yaml
     * 
     * @param app 
     * @returns void
     */
    private packages(app: App | undefined) {
        if (app === undefined || !GmaConfig.i.isWorkspace) { return; }
        
        const useCustom = vscode.workspace.getConfiguration().get<boolean>(Constants.gmaConfigWorkspaceUseCustom, false);
        let showFolders: IFolder[] = [];
        const custom = vscode.workspace.getConfiguration().get<string[]>(GmaConfig.i.worspaceCountryKey, []);
        if (useCustom && custom.length > 0) {
            showFolders = custom.map((value) =>GmaConfig.i.folderConverter(GmaConfig.i.workspaceDirUri, value));
        } else {
            const fullPattern = Constants.gmaGlobPatternPackages(app);   
            const folders = new GlobSync(fullPattern,{
                cwd: GmaConfig.i.workspaceDirFsPath,
            });
            const mapped: { uri: vscode.Uri, name?: string }[] = folders.found.filter((value) => value !== undefined).map((value) =>GmaConfig.i.folderConverter(GmaConfig.i.workspaceDirUri, value));

            const _customWorkspaceFolder = vscode.workspace.getConfiguration().get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
            const customWorkspaceFolder = _customWorkspaceFolder.map((value) => {
                return {
                    uri: vscode.Uri.file(path.join(GmaConfig.i.workspaceDirFsPath, value)),
                };
            });

            showFolders = [
                ...mapped,
                ...customWorkspaceFolder];
        }
        const output = showFolders.sort(sortFolders);
        const count = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : null;
        const updated = vscode.workspace.updateWorkspaceFolders(0, count, ...output);
        const _folders = vscode.workspace.workspaceFolders;
        if (!updated){
            void vscode.window.showErrorMessage(`Failed to update workspace folders`);
        }
        console.log(`${app}`);
        console.log(`add: ${updated} ${_folders?.length} folders`);
        return;
    }

    private async saveAppWorkspace() {
        this.isChangeTriggerFromExtension = true;
        const folders = vscode.workspace.workspaceFolders?.map((value) => path.relative(GmaConfig.i.workspaceDirFsPath, value.uri.fsPath)) ?? [];
        await vscode.workspace.getConfiguration().update( GmaConfig.i.worspaceCountryKey, folders, this.target);
        this.isChangeTriggerFromExtension = false;
        this.reload();
        void UiProgress.instance.hideAfterDelay('wrkspace', 'Your workspace was saved', Constants.shortHideAfterDelay);
    }

    private async restoreAppWorkspace() {
        if (this.waitForWorkspaceUpdate){
            void UiProgress.instance.hideAfterDelay('update','Please wait for workspace update');
            return;
        }
        this.waitForWorkspaceUpdate = true;
        this.isChangeTriggerFromExtension = true;
        await vscode.workspace.getConfiguration().update( Constants.gmaConfigWorkspaceUseCustom, false, this.target);
        const current = this.getApp();
        this.packages(current);
        this.reload();
        this.isChangeTriggerFromExtension = false;
        this.waitForWorkspaceUpdate = false;
        void UiProgress.instance.hideAfterDelay('wrkspace', 'Your workspace was restored', Constants.shortHideAfterDelay);
    }

    private async loadAppWorkspace() {
        if (this.waitForWorkspaceUpdate){
            void UiProgress.instance.hideAfterDelay('update','Please wait for workspace update');
            return;
        }
        this.waitForWorkspaceUpdate = true;
        this.isChangeTriggerFromExtension = true;
        await vscode.workspace.getConfiguration().update( Constants.gmaConfigWorkspaceUseCustom, true, this.target);
        const current = this.getApp();
        this.packages(current);
        this.reload();
        this.isChangeTriggerFromExtension = false;
        this.waitForWorkspaceUpdate = false;
        void UiProgress.instance.hideAfterDelay('wrkspace', 'Your workspace was restored', Constants.shortHideAfterDelay);
    }

    private checkOwnWorkspace(){
        const isEnabled =  vscode.workspace.getConfiguration().get<boolean>(Constants.gmaConfigWorkspaceUseCustom, false);
        const isAvailabale = vscode.workspace.getConfiguration().get<string[]>(GmaConfig.i.worspaceCountryKey, []).length > 0;
        if (!isEnabled && isAvailabale) {
            void vscode.window.showInformationMessage('Your custom workspace is not empty. Do you want to restore it?', 'Yes', 'No').then(async (value) => {
                if (value === 'Yes') {
                    await this.loadAppWorkspace();
                }
            });
        }
    }

    /**
     * Private messaging method
     * 
     * @param val 
     */
    private message(prop: {
        status: ProgressStatus,
        message?: string | undefined,
        value?: IState | undefined,
        error?: Error | undefined,
    }
    ) {
        const _message: IMessageEvent = {
            message: prop.message,
            failed: prop.error,
            status: prop.status,
            value: prop.value
        };
        this._onDidChanged.fire(_message);
    }
    
}
