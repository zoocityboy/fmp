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
    private target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace;
    private appWorkspaceFolder: vscode.WorkspaceFolder | undefined;
    public rootWorkspaceFolder: vscode.WorkspaceFolder | undefined;
    private configuration: vscode.WorkspaceConfiguration;
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
    }
    get onDidChanged(): vscode.Event<ConfiguratorChangeEvent> {
        return this._onDidChanged.event;
    }

    private loadConfig() {
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

    private async setSelected<T extends Selectable>(item: T, items: T[]): Promise<boolean> {
        items.forEach((value) => {
            value.picked = value.key === item.key;
        });
        let key = this.getSettingsKey<T>(item);
        let values = items.map((value) => value.toConfiguration());
        try {
            await this.configuration.update(key, values, this.target);
            return true;
        } catch (error) {
            this.message(undefined, error);
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

    public async setCountry(item: Country): Promise<boolean> {
        return await this.setSelected<Country>(item, this._countries);
    }

    public getCountry(reload: Boolean = false): Country | undefined {
        var _items = this._countries;
        if (reload) {
            _items = this.loadCountries();
        }
        return this.getSelected<Country>(_items);
    }

    public async setApp(item: App): Promise<boolean> {
        return await this.setSelected<App>(item, this._apps);
    }

    public getApp(reload: Boolean = false): App | undefined {
        var _items = this._apps;
        if (reload) {
            _items = this.loadApps();
        }
        return this.getSelected<App>(_items);
    }

    public async setStage(item: Stage): Promise<boolean> {
        return await this.setSelected<Stage>(item, this._stages);
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
        let program = "${workspaceFolder:Application}/lib/main_" + stage.key + ".dart";
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
     * Override workspace Folder with Appplication
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
        if (!app || !stage || !country) {
            this.message(undefined, new Error('not selected'), ProgressState.complete);
            return false;
        }
        return this.update(app, stage, country);
    }
    public async update(app: App, stage: Stage, country: Country): Promise<boolean> {
        this.message("Updating ...", undefined, ProgressState.loading);

        if (!app || !stage || !country) {
            this.message(undefined, new Error('not selected'), ProgressState.complete);
            return false;
        }
        await this.setApp(app);
        await this.setCountry(country);
        await this.setStage(stage);
        await this.updateExclude();
        await this.updateAppFolder();
        await this.updateLauncher();


        await this.wait(1000);
        this.message("success", undefined, ProgressState.complete);
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