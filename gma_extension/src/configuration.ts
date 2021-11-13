
import { Constants } from './constants';
import * as vscode from 'vscode';
import { SelectableStage } from './models/SelectableStage';
import { SelectableCountry } from './models/SelectableCountry';
import { SelectableApp } from './models/SelectableApp';
import { IConfiguratorChangeEvent } from './interfaces/IConfiguratorChangeEvent';
import { ProgressState } from './models/ProgressState';
import { ISelectable } from './interfaces/ISelectable';
import { ILaunchConfiguration } from './interfaces/ILaunchConfiguration';
import { App, listOfApps } from './models/app';
import { listOfStages, Stage } from './models/stage';
import { Country, listOfCountries } from './models/country';

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
    private _onDidChanged: vscode.EventEmitter<IConfiguratorChangeEvent>;

    public apps: App[] = listOfApps;
    public stages: Stage[] = listOfStages;
    public countries: Country[] = listOfCountries
    ;
    public getApp(): App {
        return App.fromKey(this.configuration.get<string>(Constants.gmaBuildSelectedApplication));
    }

    public getCountry(): Country {
        return Country.fromKey(this.configuration.get<string>(Constants.gmaBuildSelectedCountry));
    }
    public getStage(): Stage {
        return Stage.fromKey(this.configuration.get<string>(Constants.gmaBuildSelectedStage));
    }
    constructor() {
        this._onDidChanged = new vscode.EventEmitter<IConfiguratorChangeEvent>();
        
        this.configuration = vscode.workspace.getConfiguration();
        this.appWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.applicationFolder);
        this.rootWorkspaceFolder = vscode.workspace.workspaceFolders?.find((value) => value.name === Constants.rootFolder);
        this.runWatcher();
        this.message("success", undefined, ProgressState.complete);

    }

    get onDidChanged(): vscode.Event<IConfiguratorChangeEvent> {
        return this._onDidChanged.event;
    }

    private runWatcher() {
        this.workspaceWatcher = vscode.workspace.createFileSystemWatcher(
            '**/gma.code-workspace'
            , false, false, false);
        this.workspaceWatcher.onDidChange(() => {
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
        // this.loadConfig();
        this.message("success", undefined, ProgressState.complete);
    }

    public dispose(){
        this.workspaceWatcher?.dispose();
    }

    // private loadConfig() {
    //     console.log('loadConfig');
    //     this._apps = this.loadApps();
    //     this._countries = this.loadCountries();
    //     this._stages = this.loadStages();
    //     console.log(this._apps);
    //     console.log(this._countries);
    //     console.log(this._stages);
    // }

    // private loadApps(): SelectableApp[] {
    //     try {
    //         return this.configuration
    //             .get(Constants.configKeyApps, [])
    //             .map((item) => SelectableApp.toModel(item));
    //     } catch (e) {
    //         return [];
    //     }

    // }

    // private loadStages(): SelectableStage[] {
    //     try {
    //         return this.configuration
    //             .get(Constants.configKeyStages, [])
    //             .map((item) => SelectableStage.toModel(item));
    //     } catch (e) {
    //         return [];
    //     }
    // }

    // private loadCountries(): SelectableCountry[] {
    //     try {
    //         return this.configuration
    //             .get(Constants.configKeyCountries, [])
    //             .map((item) => SelectableCountry.toModel(item));
    //     } catch (e) {
    //         return [];
    //     }
    // }

    // private getSelected<T extends ISelectable>(items: T[]): T | undefined {
    //     return items.find((value) => value.picked === true);
    // }

    // private getSettingsKey<T extends ISelectable>(item: T): string {
    //     console.log(`getSettingsKey isApp: ${item instanceof SelectableApp} isCountry: ${item instanceof SelectableCountry} isStage: ${item instanceof SelectableStage}`);
    //     if (item instanceof SelectableApp) {
    //         return Constants.configKeyApps;
    //     } else if (item instanceof SelectableCountry) {
    //         return Constants.configKeyCountries;
    //     } else if (item instanceof SelectableStage) {
    //         return Constants.configKeyStages;
    //     }
    //     return 'gma.flavor.uups';
    // }

    // public async setCountry(item: SelectableCountry, save: boolean = false): Promise<boolean> {
    //     item.picked = true;
    //     let values = this._countries.map((value) =>{
    //         value.picked = value.key === item.key;
    //         return value;
    //     });
    //     let config = values.map((value) => value.toConfiguration());
    //     this._countries = values;
    //     if (save){
    //         await this.configuration.update(Constants.configKeyCountries, config, this.target);
    //     }
    //     return true;
    //     // return await this.setSelected<Country>(item, this._countries, save);
    // }

    // public getCountry(reload: Boolean = false): SelectableCountry | undefined {
    //     var _items = this._countries;
    //     if (reload) {
    //         _items = this.loadCountries();
    //     }
    //     return this.getSelected<SelectableCountry>(_items);
    // }

    // public async setApp(item: SelectableApp, save: boolean = false): Promise<boolean> {
    //     item.picked = true;
    //     let values = this._apps.map((value) =>{
    //         value.picked = value.key === item.key;
    //         return value;
    //     });
    //     let config = values.map((value) => value.toConfiguration());
    //     this._apps = values;
    //     if (save){
    //         await this.configuration.update(Constants.configKeyApps, config, this.target);
    //     }
    //     return true;
    // }

    // public getApp(reload: Boolean = false): SelectableApp | undefined {
    //     var _items = this._apps;
    //     if (reload) {
    //         _items = this.loadApps();
    //     }
    //     return this.getSelected<SelectableApp>(_items);
    // }

    // public async setStage(item: SelectableStage, save: boolean = false): Promise<boolean> {
    //     item.picked = true;
    //     let values = this._stages.map((value) =>{
    //         value.picked = value.key === item.key;
    //         return value;
    //     });
    //     let config = values.map((value) => value.toConfiguration());
    //     this._stages = values;
    //     if (save){
    //         await this.configuration.update(Constants.configKeyStages, config, this.target);
    //     }
        
    //     return true;
    //     // return await this.setSelected<Stage>(item, this._stages, save);
    // }

    // public getStage(reload: Boolean = false): SelectableStage | undefined {
    //     var _items = this._stages;
    //     if (reload) {
    //         _items = this.loadStages();
    //     }
    //     return this.getSelected<SelectableStage>(_items);
    // }

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
        console.log(`getFlavorShortTag: ${tag}`);
        return tag;
    }

    /**
     * Update launcher settings with selected app
     */
    private async updateLauncher() {
        // let stage: SelectableStage | undefined = this.getStage();
        // let shortTag: string | undefined = this.getFlavorShortTag();
        // if (!stage || !shortTag) {
        //     return;
        // }
        // let launchers: ILaunchConfiguration[] | undefined = this.configuration.get<ILaunchConfiguration[]>('launch.configurations', []);
        // let updated: ILaunchConfiguration[] | undefined = this.configuration.get<ILaunchConfiguration[]>('launch.configurations', []);
        // let program = "lib/main_" + stage.key + ".dart";
        // let args = ["--flavor", shortTag];
        // launchers.forEach((value) => {
        //     value.args = args;
        //     value.program = program;
        // });
        // await this.configuration.update('launch.configurations', launchers, this.target);

    }

    /***
     * Update excludes in workspace
     * based on selected app
     */
    private async updateExclude() {
        // let exclude: {} | undefined = this.configuration.get<{}>('files.exclude', {});
        // let appExclude = this.getApp()?.exclude ?? {};
        // const newValue = { ...exclude, ...appExclude };
        // await this.configuration.update('files.exclude', newValue, this.target);
    }

    /***
     * Override workspace Folder with Application
     * based on selected app
     */
    private async updateAppFolder(): Promise<boolean> {
        // const folder = this.appWorkspaceFolder;
        // const app = this.getApp();
        // if (!folder || !app) {
        //     return false;
        // }
        // return vscode.workspace.updateWorkspaceFolders(0, 1, {
        //     uri: vscode.Uri.joinPath(folder.uri, `../${app.key}`),
        //     name: Constants.applicationFolder
        // });
       return Promise.resolve(true);
    }

    public async apply(): Promise<boolean> {
        // let app = this.getApp();
        // let stage = this.getStage();
        // let country = this.getCountry();
        // console.log(`apply------------------`);
        // console.log(`app: ${app?.key} stage: ${stage?.key} country: ${country?.key}`);
        // console.log(this._apps);
        // console.log(this._countries);
        // console.log(this._stages);
        // if (!app || !stage || !country) {
        //     this.message(undefined, new Error('not selected'), ProgressState.complete);
        //     return false;
        // }
        // return await this.update(app, stage, country);
        return Promise.resolve(true);
    }

    public async update(app: App, stage: Stage, country: Country): Promise<boolean> {
        // if (!app || !stage || !country) {
        //     this.message(undefined, new Error('not selected'), ProgressState.complete);
        //     return false;
        // }
        // this.message("Updating ...", undefined, ProgressState.loading);
        // await this.setApp(app, true);
        // await this.setCountry(country, true);
        // await this.setStage(stage, true);
        // await this.updateExclude();
        // await this.updateAppFolder();
        // await this.updateLauncher();

        // this.message("success", undefined, ProgressState.complete);
        //  this.configuration.inspect<SelectableApp[]>(Constants.configKeyApps);
        //  this.configuration.inspect<SelectableCountry[]>(Constants.configKeyCountries);
        //  this.configuration.inspect<SelectableStage[]>(Constants.configKeyStages);
        // return true;
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
        } as IConfiguratorChangeEvent;
        this._onDidChanged.fire(_message);
    }

    private wait = (ms: number) => new Promise(res => setTimeout(res, ms));
}