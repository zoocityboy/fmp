import { YamlUtils } from "../../core";
import { App, GmaAppConfiguration, GmaConfigurationFile, GmaConfigurationRunner } from "../../models";

export class GmaConfig{
    private _configuration: GmaConfigurationFile | undefined;
    private static _instance: GmaConfig;
    public static get instance() {
        this._instance = this._instance ?? new GmaConfig();
        return this._instance;
    }
    constructor(){
        this.load();
    }

    public load(){
        this._configuration = new YamlUtils().load();
    }
    get data(): GmaConfigurationFile | undefined {
        return this._configuration ?? new YamlUtils().load();
    } 

    get servers(): GmaAppConfiguration[] {
        return this._configuration?.servers ?? [];
    }
    get applications(): GmaAppConfiguration[] {
        return this._configuration?.applications ?? [];
    }

    get appAsModelApp(): App[]{
        return this.applications.map(app => app.asApp) ?? [];
    }

    get runners(): GmaConfigurationRunner[] {
        return this._configuration?.platformSupportedRunners ?? [];
    }
}