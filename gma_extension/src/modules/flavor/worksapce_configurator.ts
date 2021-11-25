
import { Constants } from '../../models/constants';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import {  IMessageEvent, App, listOfApps, Stage, listOfStages, Country, listOfCountries, ProgressStatus, IState, ILaunchConfiguration, GmaConfigurationFile } from '../../models';
import { GlobSync } from 'glob';
import { Process } from '../../core';
import { GmaConfig } from './workspace_config';

/**
 * Configuration class which works over the current Workspace
 * 
 */
export class WorkspaceConfigurator {
    private target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace;
    private gmaYaml: GmaConfigurationFile | undefined;
    private configuration: vscode.WorkspaceConfiguration;
    private workspaceWatcher: vscode.FileSystemWatcher | undefined;
    public isChangeTriggerFromExtension = false;
    private _onDidChanged: vscode.EventEmitter<IMessageEvent>;

    public apps: App[] = listOfApps;
    public stages: Stage[] = listOfStages;
    public countries: Country[] = listOfCountries;

    private waitForWorkspaceUpdate = false;

    public getApp(): App {
        const _key = this.configuration.get<string>(Constants.gmaConfigBuildSelectedApplication);
        return App.fromKey(_key ?? Constants.defaultAppKey);
    }

    public getCountry(): Country {
        const _key = this.configuration.get<string>(Constants.gmaConfigBuildSelectedCountry);
        return Country.fromKey(_key ?? Constants.defaultCountryKey);
    }

    public getStage(): Stage {
        const _key = this.configuration.get<string>(Constants.gmaConfigBuildSelectedStage);
        return Stage.fromKey(_key ?? Constants.defaultStageKey);
    }

    getDirPath(uri: vscode.Uri) {
        return fs.statSync(uri.fsPath).isFile() ? vscode.Uri.joinPath(uri, '../').fsPath : uri.fsPath;
    }

    getFileFolder(uri: vscode.Uri): vscode.Uri {
        const stats = fs.statSync(uri.fsPath);
        if (stats.isDirectory()) {
            return uri;
        } else if (stats.isFile()) {
            const dirname = path.dirname(uri.fsPath);
            return vscode.Uri.parse(dirname);
        }
        return uri;
    }

    constructor(context: vscode.ExtensionContext) {
        this.configuration = vscode.workspace.getConfiguration();
        this._onDidChanged = new vscode.EventEmitter<IMessageEvent>();
        context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((e) => this.updateWorkspaces(e)));
        this.loadConfiguration();
        this.runWatcher();
    }

    private loadConfiguration(){
        this.gmaYaml = GmaConfig.instance.data;
        this.apps = GmaConfig.instance.appAsModelApp ?? listOfApps;
    }


    private async updateWorkspaces(e: vscode.WorkspaceFoldersChangeEvent): Promise<void>{
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
        this.workspaceWatcher = vscode.workspace.createFileSystemWatcher(Constants.workspaceFileName, false, false, false);
        this.workspaceWatcher.onDidChange(() => {
            if (!this.isChangeTriggerFromExtension) {
                this.reload();
                this.message({ message: "success", status: ProgressStatus.success });
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                void vscode.window.showInformationMessage('Workspace changed outside GMA Studio');
                
            }
            this.waitForWorkspaceUpdate = false;
        });
    }

    public reload() {
        this.configuration = vscode.workspace.getConfiguration();
        void vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
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
            void vscode.window.showInformationMessage('Please wait for workspace update');
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
            console.log('Change flavor: finally');
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
        const workspaceFile = vscode.workspace.workspaceFile;
        if (workspaceFile === undefined) {
            return;
        }
        const items = this.configuration.get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
        const newItems = folders.map((value) => value.uri);
        newItems.forEach((value) => {
            const rootPath = path.dirname(workspaceFile.fsPath);
            const relative = path.relative(rootPath, value.fsPath);
            if (!items.includes(relative) && relative.length > 0) {
                items.push(relative);
            }
        });
        await this.configuration.update(Constants.gmaConfigCustomWorkspaceFolders, items, this.target);
    }
    /**
     * Update the workspace configuration with the new values
     * and remove the old values from persistant storage
     * 
     * @param folders 
     */
    private async folderRemoved(folders: vscode.WorkspaceFolder[]) {
        const workspaceFile = vscode.workspace.workspaceFile;
        if (workspaceFile === undefined) {
            return;
        }
        const items = this.configuration.get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
        const newItems = folders.map((value) => value.uri);
        newItems.forEach((value) => {
            const rootPath = path.dirname(workspaceFile.fsPath);
            const relative = path.relative(rootPath, value.fsPath);
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
            value.args = args;
            value.program = program;
            value.cwd = `\${fileDirname}\${pathSeparator}${state.app?.folder}`;
        });
        await this.configuration.update(Constants.settingsLaunchConfigurations, launchers, this.target);

    }
    /**
     * Update workspace with selected packages from selected app
     * will exclude packages defined in gma.yaml
     * 
     * @param app 
     * @returns void
     */
    private packages(app: App | undefined) {
        if (app === undefined || vscode.workspace.workspaceFile === undefined) { return; }
       
        const fullPattern = this.gmaGlobPatternPackages(app);
    
        const rootFolder = path.dirname(vscode.workspace.workspaceFile.fsPath);
        const rootUri = vscode.Uri.parse(rootFolder);
        const folders = new GlobSync(fullPattern,{
            cwd: rootFolder,
        });

        const mapped: { uri: Uri, name?: string }[] = folders.found.filter((value) => value !== undefined).map((value) => {
            return {
                uri: vscode.Uri.file(path.join(rootUri.path, value)),
            } as { uri: Uri, name?: string };
        }).sort((obj1, obj2) => {
            if (obj1.uri.path > obj2.uri.path) {
                return 1;
            }

            if (obj1.uri.path < obj2.uri.path) {
                return -1;
            }

            return 0;
        });

        const _customWorkspaceFolder = this.configuration.get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
        const customWorkspaceFolder = _customWorkspaceFolder.map((value) => {
            return {
                uri: vscode.Uri.file(path.join(rootUri.path, value)),
            };
        });

        const sorted = [
            ...mapped,
            ...customWorkspaceFolder];
        const add = vscode.workspace.updateWorkspaceFolders(0, vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : null, ...sorted);
        const _folders = vscode.workspace.workspaceFolders;
        console.log(`${app}`);
        console.log(`add: ${add} ${_folders?.length} folders`);
        return;
    }
    /**
     * Prepare glob pattern for packages from selected app
     * 
     * @param app 
     * @returns full glob pattern
     */
    private gmaGlobPatternPackages(app: App): string {
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