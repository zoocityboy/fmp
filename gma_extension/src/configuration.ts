import { App, ConfiguratorChangeEvent, Country, LaunchConfiguration, ProgressState, Selectable, Stage } from "./models";
import { Constants } from './constants';
import * as vscode from 'vscode';

export interface IWorkspaceConfigurator {
    // readonly onDidChangeSelection: vscode.Event<ConfiguratorChangeEvent[]>;
}
/**
 * Configuration class which works over the current Workspace
 * 
 */
export class WorkspaceConfigurator implements IWorkspaceConfigurator {
    private workspaceWatcher: vscode.FileSystemWatcher | undefined;
    private target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace;
    private appWorkspaceFolder: vscode.WorkspaceFolder | undefined;
    public rootWorkspaceFolder: vscode.WorkspaceFolder | undefined;
    private configuration: vscode.WorkspaceConfiguration;
    public isChangeTriggerFromExtension: boolean = false;

    private _stages: Stage[] = [];
    public get stages() {
        return this._stages;
    }
    private _countries: Country[] = [];
    public get countries() {
        return this._countries;
    }
    private _apps: App[] = [];
    public get apps() {
        return this._apps;
    }

    private _onDidChanged: vscode.EventEmitter<ConfiguratorChangeEvent>;

    constructor() {
        this._onDidChanged = new vscode.EventEmitter<ConfiguratorChangeEvent>();
        this.configuration = vscode.workspace.getConfiguration();
        this.appWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.applicationFolder);
        this.rootWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.rootFolder);
        this.loadConfig();
        this.runWatcher();
      

    }

    get onDidChanged(): vscode.Event<ConfiguratorChangeEvent> {
        return this._onDidChanged.event;
    }

    private runWatcher() {
        this.workspaceWatcher = vscode.workspace.createFileSystemWatcher(
            '**/gma.code-workspace'
            , false, false, false);
        this.workspaceWatcher.onDidChange(() => {
            // this.onDidChanged();


            if (!this.isChangeTriggerFromExtension) {
                this.reload();
                this.message("success", undefined, ProgressState.complete);
            }
            console.log(`workspace file did changed ${this.isChangeTriggerFromExtension}`);
        });
    }

    public reload(){
        console.log('reload');
        this.configuration = vscode.workspace.getConfiguration();
        this.appWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.applicationFolder);
        this.rootWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.rootFolder);
        this.loadConfig();
    }

    public dispose(){
        this.workspaceWatcher?.dispose();
    }

    private loadConfig() {
        console.log('loadConfig');
        this._apps = this.loadApps();
        this._countries = this.loadCountries();
        this._stages = this.loadStages();
        console.log(this._apps);
        console.log(this._countries);
        console.log(this._stages);
    }

    private loadApps(): App[] {
        try {
            return this.configuration
                .get(Constants.configKeyApps, [])
                .map((item) => App.toModel(item));
        } catch (e) {
            return [];
        }

    }

    private loadStages(): Stage[] {
        try {
            return this.configuration
                .get(Constants.configKeyStages, [])
                .map((item) => Stage.toModel(item));
        } catch (e) {
            return [];
        }
    }

    private loadCountries(): Country[] {
        try {
            return this.configuration
                .get(Constants.configKeyCountries, [])
                .map((item) => Country.toModel(item));
        } catch (e) {
            return [];
        }
    }

    private async setSelected<T extends Selectable>(item: T, items: T[], save: boolean): Promise<boolean> {
        items.forEach((value) => {
            value.picked = value.key === item.key;
        });
        let key = this.getSettingsKey<T>(item);
        let values = items.map((value) => value.toConfiguration());
        if (item instanceof App) {
            this._apps = items.map((value) => value as unknown as App);
        } else if (item instanceof Country) {
            this._countries = items.map((value) => value as Country);
        } else if (item instanceof Stage) {
            this._stages = items.map((value) => value as Stage);
        }
        try {
            await this.configuration.update(key, values, this.target);
            return true;
        } catch (error) {
            this.message('setSelected failed', error);
            return false;
        }

    }

    private getSelected<T extends Selectable>(items: T[]): T | undefined {
        return items.find((value) => value.picked === true);
    }

    private getSettingsKey<T extends Selectable>(item: T): string {
        console.log(`getSettingsKey isApp: ${item instanceof App} isCountry: ${item instanceof Country} isStage: ${item instanceof Stage}`);
        if (item instanceof App) {
            return Constants.configKeyApps;
        } else if (item instanceof Country) {
            return Constants.configKeyCountries;
        } else if (item instanceof Stage) {
            return Constants.configKeyStages;
        }
        return 'gma.flavor.uups';
    }

    public async setCountry(item: Country, save: boolean = false): Promise<boolean> {
        item.picked = true;
        let values = this._countries.map((value) =>{
            value.picked = value.key === item.key;
            return value;
        });
        let config = values.map((value) => value.toConfiguration());
        this._countries = values;
        if (save){
            await this.configuration.update(Constants.configKeyCountries, config, this.target);
        }
        return true;
        // return await this.setSelected<Country>(item, this._countries, save);
    }

    public getCountry(reload: Boolean = false): Country | undefined {
        var _items = this._countries;
        if (reload) {
            _items = this.loadCountries();
        }
        return this.getSelected<Country>(_items);
    }

    public async setApp(item: App, save: boolean = false): Promise<boolean> {
        item.picked = true;
        let values = this._apps.map((value) =>{
            value.picked = value.key === item.key;
            return value;
        });
        let config = values.map((value) => value.toConfiguration());
        this._apps = values;
        if (save){
            await this.configuration.update(Constants.configKeyApps, config, this.target);
        }
        return true;
    }

    public getApp(reload: Boolean = false): App | undefined {
        var _items = this._apps;
        if (reload) {
            _items = this.loadApps();
        }
        return this.getSelected<App>(_items);
    }

    public async setStage(item: Stage, save: boolean = false): Promise<boolean> {
        item.picked = true;
        let values = this._stages.map((value) =>{
            value.picked = value.key === item.key;
            return value;
        });
        let config = values.map((value) => value.toConfiguration());
        this._stages = values;
        if (save){
            await this.configuration.update(Constants.configKeyStages, config, this.target);
        }
        
        return true;
        // return await this.setSelected<Stage>(item, this._stages, save);
    }

    public getStage(reload: Boolean = false): Stage | undefined {
        var _items = this._stages;
        if (reload) {
            _items = this.loadStages();
        }
        return this.getSelected<Stage>(_items);
    }

    /***
     * Simply get short tag from selected country and stage
     * example: 
     *  Indian, Fake => fakein
     *  Vietnam,Production => prodvn
     */
    public getFlavorShortTag(): string | undefined {
        let stage: Stage | undefined = this.getStage();
        let country: Country | undefined = this.getCountry();
        if (!country || !stage) {
            return undefined;
        }
        let tag = `${stage?.key}${country?.key}`;
        return tag;
    }

    /**
     * Update launcher settings with selected app
     */
    private async updateLauncher() {
        let stage: Stage | undefined = this.getStage();
        let shortTag: string | undefined = this.getFlavorShortTag();
        if (!stage || !shortTag) {
            return;
        }
        let launchers: LaunchConfiguration[] | undefined = this.configuration.get<LaunchConfiguration[]>('launch.configurations', []);
        let updated: LaunchConfiguration[] | undefined = this.configuration.get<LaunchConfiguration[]>('launch.configurations', []);
        let program = "lib/main_" + stage.key + ".dart";
        let args = ["--flavor", shortTag];
        launchers.forEach((value) => {
            value.args = args;
            value.program = program;
        });
        await this.configuration.update('launch.configurations', launchers, this.target);

    }

    /***
     * Update excludes in workspace
     * based on selected app
     */
    private async updateExclude() {
        let exclude: {} | undefined = this.configuration.get<{}>('files.exclude', {});
        let appExclude = this.getApp()?.exclude ?? {};
        const newValue = { ...exclude, ...appExclude };
        await this.configuration.update('files.exclude', newValue, this.target);
    }

    /***
     * Override workspace Folder with Application
     * based on selected app
     */
    private async updateAppFolder(): Promise<boolean> {
        const folder = this.appWorkspaceFolder;
        const app = this.getApp();
        if (!folder || !app) {
            return false;
        }
        return vscode.workspace.updateWorkspaceFolders(0, 1, {
            uri: vscode.Uri.joinPath(folder.uri, `../${app.key}`),
            name: Constants.applicationFolder
        });
    }

    public async apply(): Promise<boolean> {
        let app = this.getApp();
        let stage = this.getStage();
        let country = this.getCountry();
        console.log(`apply------------------`);
        console.log(`app: ${app?.key} stage: ${stage?.key} country: ${country?.key}`);
        console.log(this._apps);
        console.log(this._countries);
        console.log(this._stages);
        if (!app || !stage || !country) {
            this.message(undefined, new Error('not selected'), ProgressState.complete);
            return false;
        }
        return await this.update(app, stage, country);
    }

    public async update(app: App, stage: Stage, country: Country): Promise<boolean> {
        if (!app || !stage || !country) {
            this.message(undefined, new Error('not selected'), ProgressState.complete);
            return false;
        }
        this.message("Updating ...", undefined, ProgressState.loading);
        await this.setApp(app, true);
        await this.setCountry(country, true);
        await this.setStage(stage, true);
        await this.updateExclude();
        await this.updateAppFolder();
        await this.updateLauncher();

        this.message("success", undefined, ProgressState.complete);
         this.configuration.inspect<App[]>(Constants.configKeyApps);
         this.configuration.inspect<Country[]>(Constants.configKeyCountries);
         this.configuration.inspect<Stage[]>(Constants.configKeyStages);
        return true;
    }
    private message(
        message?: string | undefined,
        error: Error | unknown | undefined = undefined,
        state: ProgressState = ProgressState.default,
    ) {
        let _message = {
            message: message,
            failed: error,
            state: state,
        } as ConfiguratorChangeEvent;
        this._onDidChanged.fire(_message);
    }

    private wait = (ms: number) => new Promise(res => setTimeout(res, ms));
}