
import { Constants } from '../../models/constants';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { ChangeFlavorTask } from './tasks';
import { YamlUtils } from '../../core/YamlUtils';
import { IWorkspaceConfigurator, IMessageEvent, App, listOfApps, Stage, listOfStages, Country, listOfCountries, ProgressStatus, IState, IBuildSettings, ILaunchConfiguration, GmaConfigurationFile } from '../../models';
import { basename } from 'path';

/**
 * Configuration class which works over the current Workspace
 * 
 */
export class WorkspaceConfigurator implements IWorkspaceConfigurator {
    private target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace;
    private gmaYaml: GmaConfigurationFile | undefined;

    private workspaceWatcher: vscode.FileSystemWatcher | undefined;
    private configuration: vscode.WorkspaceConfiguration;
    public isChangeTriggerFromExtension: boolean = false;
    private _onDidChanged: vscode.EventEmitter<IMessageEvent>;

    public apps: App[] = listOfApps;
    public stages: Stage[] = listOfStages;
    public countries: Country[] = listOfCountries;

    private task: ChangeFlavorTask | undefined;

    public getApp(): App {
        return App.fromKey(this.configuration.get<string>(Constants.gmaConfigBuildSelectedApplication) ?? Constants.defaultAppKey);
    }

    public getCountry(): Country {
        return Country.fromKey(this.configuration.get<string>(Constants.gmaConfigBuildSelectedCountry) ?? Constants.defaultCountryKey);
    }

    public getStage(): Stage {
        return Stage.fromKey(this.configuration.get<string>(Constants.gmaConfigBuildSelectedStage) ?? Constants.defaultStageKey);
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

    getRootFolder(): vscode.Uri | undefined {
        if (vscode.workspace.workspaceFile === undefined) {
            console.log('No workspace opened');
            return undefined;
        }
        return this.getFileFolder(vscode.workspace.workspaceFile);
    }

    getGmaYaml(): vscode.Uri | undefined {
        const rootFolder = this.getRootFolder();
        if (rootFolder === undefined) {
            console.log('No workspace opened');
            return undefined;
        }
        return vscode.Uri.joinPath(rootFolder, Constants.workspaceGmaYaml);
    }

    constructor(context: vscode.ExtensionContext) {
        vscode.workspace.onDidChangeWorkspaceFolders((e) => {
            console.log(`onDidChangeWorkspaceFolders added: ${e.added}`);
            console.log(`onDidChangeWorkspaceFolders removed: ${e.removed}`);
        });
        this._onDidChanged = new vscode.EventEmitter<IMessageEvent>();
        this.configuration = vscode.workspace.getConfiguration();
        const yamlTools = new YamlUtils();
        this.gmaYaml = yamlTools.load();
        this.apps = this.gmaYaml?.applications.map((value)=> value.asApp) ?? listOfApps;
        const rootFolder = this.getRootFolder();
        
        this.task = new ChangeFlavorTask(rootFolder);
        this.task.onDidChanged((value) => {
            console.log(`FlavorTasks: ${value.message} ${value.status} ${value.failed}`);
            switch (value.status) {
                case ProgressStatus.loading:
                    this.isChangeTriggerFromExtension = true;
                    this.message(value);
                    break;
                case ProgressStatus.failed:
                    this.updateWorkspace(value.value!);
                    this.message(value);
                    break;
                case ProgressStatus.success:
                    this.isChangeTriggerFromExtension = false;
                    this.updateWorkspace(value.value!);
                    this.message(value);
                    break;
            }
        });
        this.runWatcher();

    }
    

    get onDidChanged(): vscode.Event<IMessageEvent> {
        return this._onDidChanged.event;
    }

    private runWatcher() {
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            console.log('workspace folder changed');
        });
        this.workspaceWatcher = vscode.workspace.createFileSystemWatcher(Constants.workspaceFileName, false, false, false);
        this.workspaceWatcher.onDidChange(() => {
            if (!this.isChangeTriggerFromExtension) {
                this.reload();
                this.message({ message: "success", status: ProgressStatus.success });
            }
            console.log(`workspace file did changed ${this.isChangeTriggerFromExtension}`);
        });
    }

    public reload() {
        this.configuration = vscode.workspace.getConfiguration();
        // this.appWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.applicationFolder);
    }

    public dispose() {
        this.workspaceWatcher?.dispose();
    }
    public async runCommand(state: IState) {
        this.isChangeTriggerFromExtension = true;
        await this.task?.run(state);
    }

    /**
     * Update Workspace
     * - save workspace changes from selected *IState*
     * @param state 
     */
    public async updateWorkspace(state: IState): Promise<void> {
        const inspector = vscode.workspace.getConfiguration().inspect<IBuildSettings>(Constants.gmatBuildSection);
        await this.configuration.update(Constants.gmatBuildSection, {
            selectedApplication: state.app?.key ?? inspector?.defaultValue?.selectedApplication ?? Constants.defaultAppKey,
            selectedCountry: state.country?.key ?? inspector?.defaultValue?.selectedCountry ?? Constants.defaultCountryKey,
            selectedStage: state.stage?.key ?? inspector?.defaultValue?.selectedStage ?? Constants.defaultStageKey
        } as IBuildSettings, this.target);
        await this.updateLauncher(state);
        await this.updateAppFolder(state.app);
        // await this.updateExclude(state.app);
        await this.packages(state.app);
        const inspector1 = vscode.workspace.getConfiguration().inspect(Constants.gmatBuildSection);
        console.log(inspector1);
    }

    /**
     * Update launcher settings with selected app
     */
    private async updateLauncher(state: IState) {
        if (state.stage === undefined || state.country === undefined) { return; }
        let shortTag: string | undefined = `${state.stage.key}${state.country.key}`;
        if (!state.stage || !shortTag) {
            return;
        }
        let launchers: ILaunchConfiguration[] | undefined = this.configuration.get<ILaunchConfiguration[]>(Constants.settingsLaunchConfigurations, []);
        let program = Constants.launcherProgram(state.stage);
        let args = Constants.launcherArgs(state);
        launchers.forEach((value) => {
            value.args = args;
            value.program = program;
        });
        await this.configuration.update(Constants.settingsLaunchConfigurations, launchers, this.target);

    }

    /***
     * Override workspace Folder with Application
     * based on selected app
     */
    private async updateAppFolder(app: App | undefined) {
        if (app === undefined) {
            return Promise.resolve(false);
        }
        const folder = this.getRootFolder();

        if (!folder || !app) {
            return false;
        }
        // vscode.workspace.updateWorkspaceFolders(0, 1, {
        //     uri: vscode.Uri.joinPath(folder, app.folder!),
        //     name: Constants.applicationFolder
        // });

    }

    private async packages(app: App | undefined) {
        if (app === undefined) { return; }
        const rootFolder = this.getRootFolder();
        if (rootFolder  === undefined|| app === undefined) {
            return;
        }
        const exclude: string[] = [];
        app.exclude?.forEach((value, key) => {
            if (value) {
                exclude.push(`!${key}`);
            }
        });
        const packagePattern = exclude.join(',');
        const fullPattern = `packages/[${packagePattern}]**/pubspec.yaml`;

        const pattern = new vscode.RelativePattern(rootFolder!, fullPattern);
        const pubspecYamls = await vscode.workspace.findFiles(pattern, '**/example/**');
        const folders = pubspecYamls.map((value) => { return this.getFileFolder(value); });
        const mapped: { uri: Uri, name?: string }[] = folders.filter((value) => value !== undefined).map((value) => {
            return {
                uri: value!,
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
        const _customWorkspaceFolder = vscode.workspace.getConfiguration().get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
        const customWorkspaceFolder = _customWorkspaceFolder.map((value) => {
            return {
                uri: vscode.Uri.joinPath(rootFolder!, value),
            };
        });

        const sorted = [
         ...mapped,
        ...customWorkspaceFolder];
        const add = vscode.workspace.updateWorkspaceFolders(0, vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : null, ...sorted);
        const _folders = vscode.workspace.workspaceFolders;
        console.log(`${_folders?.length}`);
        // vscode.workspace.applyEdit(new vscode.WorkspaceEdit());

    }
    private sort(nodes: { uri: Uri, name?: string }[]): { uri: Uri, name?: string }[] {
		return nodes.sort((n1, n2) => {
			return basename(n1.uri.fsPath).localeCompare(basename(n2.uri.fsPath));
		});
	}


    /**
     * Private messaging method
     * 
     * @param val 
     */
    private message(val: {
        status: ProgressStatus,
        message?: string | undefined,
        value?: IState | undefined,
        error?: Error | unknown,
    }
    ) {
        let _message = {
            message: val.message,
            failed: val.error,
            status: val.status,
            value: val.value
        } as IMessageEvent;
        this._onDidChanged.fire(_message);
    }

    private wait = (ms: number) => new Promise(res => setTimeout(res, ms));
}