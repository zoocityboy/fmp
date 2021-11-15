
import { Constants } from '../../models/constants';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { IMessageEvent } from '../../models/interfaces/IMessageEvent';
import { ProgressStatus } from '../../models/dto/ProgressState';
import { App, listOfApps } from '../../models/dto/app';
import { listOfStages, Stage } from '../../models/dto/stage';
import { Country, listOfCountries } from '../../models/dto/country';
import { IState } from '../../models/interfaces/IState';
import { ILaunchConfiguration } from '../../models/interfaces/ILaunchConfiguration';
import { IWorkspaceConfigurator } from '../../models/interfaces/IWorkspaceConfigurator';
import { ChangeFlavorTask } from './tasks';
import * as yaml from 'yaml';

/**
 * Configuration class which works over the current Workspace
 * 
 */
export class WorkspaceConfigurator implements IWorkspaceConfigurator {
    private target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace;
    private gmaYaml: any;

    private appWorkspaceFolder: vscode.WorkspaceFolder | undefined;
    public rootWorkspaceFolder: vscode.WorkspaceFolder | undefined;

    private workspaceWatcher: vscode.FileSystemWatcher | undefined;
    private configuration: vscode.WorkspaceConfiguration;
    public isChangeTriggerFromExtension: boolean = false;
    private _onDidChanged: vscode.EventEmitter<IMessageEvent>;

    public apps: App[] = listOfApps;
    public stages: Stage[] = listOfStages;
    public countries: Country[] = listOfCountries;

    private task: ChangeFlavorTask | undefined;

    public getApp(): App {
        return App.fromKey(this.configuration.get<string>(Constants.gmaBuildSelectedApplication) ?? Constants.defaultAppKey);
    }

    public getCountry(): Country {
        return Country.fromKey(this.configuration.get<string>(Constants.gmaBuildSelectedCountry) ?? Constants.defaultCountryKey);
    }

    public getStage(): Stage {
        return Stage.fromKey(this.configuration.get<string>(Constants.gmaBuildSelectedStage) ?? Constants.defaultStageKey);
    }
    getDirPath(uri: vscode.Uri) {
        return fs.statSync(uri.fsPath).isFile() ? vscode.Uri.joinPath(uri, '../').fsPath : uri.fsPath;
    }
    private loadFromGmaYaml() {
        const filePath = vscode.Uri.joinPath(this.rootWorkspaceFolder!.uri, 'gma.yaml').fsPath;
        if (fs.existsSync(filePath)) {
            try{
                const yamlFile = fs.readFileSync(filePath, 'utf8');
                console.log(yamlFile);
                this.gmaYaml = yaml.parse(yamlFile);
                let apps = this.gmaYaml.apps;
                console.log(apps);
            } catch (error) {
                console.error(error);
            }
        } else {
            console.log(`${filePath} not found`);
        }
    }

    constructor(context: vscode.ExtensionContext) {
        const extPackageJSON = context.extension.packageJSON;
        
        
        this._onDidChanged = new vscode.EventEmitter<IMessageEvent>();
        this.configuration = vscode.workspace.getConfiguration();
        this.appWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.applicationFolder);
        this.rootWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.rootFolder);
        ///    
        this.loadFromGmaYaml();
        ///
        this.task = new ChangeFlavorTask(this.rootWorkspaceFolder);
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
        this.workspaceWatcher = vscode.workspace.createFileSystemWatcher(
            '**/gma.code-workspace'
            , false, false, false);
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
        this.appWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.applicationFolder);
        this.rootWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.rootFolder);
    }

    public dispose() {
        this.workspaceWatcher?.dispose();
    }
    public async runCommand(state: IState) {
        this.isChangeTriggerFromExtension = true;
        await this.task?.changeFlavor(state);
    }

    /**
     * Update Workspace
     * - save workspace changes from selected *IState*
     * @param state 
     */
    public async updateWorkspace(state: IState): Promise<void> {
        await this.configuration.update(Constants.gmaBuildSelectedApplication, state.app?.key, this.target);
        await this.configuration.update(Constants.gmaBuildSelectedCountry, state.country?.key, this.target);
        await this.configuration.update(Constants.gmaBuildSelectedStage, state.stage?.key, this.target);
        await this.updateLauncher(state);
        await this.updateAppFolder(state.app);
        await this.updateExclude(state.app);
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
     * Update excludes in workspace
     * based on selected app
     */
    private async updateExclude(app: App | undefined) {
        if (app === undefined) { return; }
        let exclude: {} | undefined = this.configuration.get<{}>(Constants.settingsFilesExclude, {});
        let appExclude = app.exclude ?? {};
        const newValue = { ...exclude, ...appExclude };
        await this.configuration.update(Constants.settingsFilesExclude, newValue, this.target);
    }

    /***
     * Override workspace Folder with Application
     * based on selected app
     */
    private async updateAppFolder(app: App | undefined) {
        if (app === undefined) {
            return Promise.resolve(false);
        }
        const folder = this.appWorkspaceFolder;

        if (!folder || !app) {
            return false;
        }
        const updated = vscode.workspace.updateWorkspaceFolders(0, 1, {
            uri: vscode.Uri.joinPath(folder.uri, `../${app.folder}`),
            name: Constants.applicationFolder
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