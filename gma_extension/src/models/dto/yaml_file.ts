import { App } from "./app";
import * as os from "os";
/**
 * interface for yaml file conversion
 */
export interface IGmaAppConfiguration{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    package_name: string;
    title: string;
    description: string;
    version: number;
    folder: string;
    flavor?: string[] | undefined;
    stages?: string[] | undefined;
    countries?: string[] | undefined;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    exclude_packages?: {
        "capp": boolean,
        "mapp": boolean,
        "koyal": boolean,
    } | undefined;
    port?: number | undefined;
}
/**
 * DTO for yaml file
 * 
 * @class GmaConfigurationFile
 */
export class GmaConfigurationFile {
    name: string;
    description: string;
    apps: GmaAppConfiguration[];
    packages: string[];
    runners?: GmaConfigurationRunner[];
    
    constructor(val: {name: string, description: string, apps: GmaAppConfiguration[], packages: string[], runners: GmaConfigurationRunner[]}) {
        this.name = val.name;
        this.description = val.description;
        this.apps = val.apps;
        this.packages = val.packages;
        this.runners = val.runners;
    }

    get servers(): GmaAppConfiguration[] {
        return this.apps.filter(app => app.isServer) ?? [];
    }
    get applications(): GmaAppConfiguration[] {
        return this.apps.filter(app => !app.isServer) ?? [];
    }
    get platformSupportedRunners(): GmaConfigurationRunner[] {
        const isWin = os.platform() === 'win32';
        return this.runners?.filter(runner => runner.name.startsWith('win:') === isWin) ?? [];
        
    }
}
/**
 * DTO for yaml file
 * 
 * @class GmaAppConfiguration
 */
export class GmaAppConfiguration {
    packageName: string;
    title: string;
    description: string;
    version: number;
    folder: string;
    
    flavor?: string[] | undefined;
    stages?: string[] | undefined;
    countries?: string[] | undefined;
    exclude?: Map<string,boolean> | undefined;
    port?: number | undefined;
    
    constructor(val:{packageName: string, title: string, version: number, folder: string, description: string, 
        flavor?: string[] | undefined,
        stages?: string[] | undefined, 
        countries?: string[] | undefined, 
        exclude?: Map<string,boolean> | undefined, 
        port?: number | undefined}) {

        this.packageName = val.packageName;
        this.title = val.title;
        this.description = val.description;

        this.version = val.version;
        this.folder = val.folder;
        this.flavor = val.flavor;
        this.stages = val.stages;
        this.countries = val.countries;
        this.exclude = val.exclude;
        this.port = val.port;
    }
    get isServer(): boolean {
        return this.port !== undefined;
    }
    get commandId(): string {
        return `gma.commands.server.show.${this.packageName}`;
    }
    get serverComandId(): string {
        return `${this.packageName}:${this.port}`;
    }
    get viewType(): string {
        return `gma.browser.viewType.${this.packageName}`;
    }

    get url(): string {
        return `http://localhost:${this.port}`;
    }

    get asApp(): App{
        return new App({
            key: this.packageName,
            title: this.title,
            detail: this.description,
            folder: this.folder,
            exclude: this.exclude,
        });
    }
    

}
/**
 * DTO for yaml file
 * 
 * @class GmaConfigurationRunner
 */
export class GmaConfigurationRunner {
    name: string;
    run: string;
    description: string;
    
    constructor(val: {name: string, run: string, description: string}) {
        this.name = val.name;
        this.run = val.run;
        this.description = val.description;
    }
}