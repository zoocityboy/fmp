import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Constants } from '../models/constants';
import { 
    GmaAppConfiguration,GmaConfigurationRunner, GmaConfigurationFile, IGmaAppConfiguration, IGmaConfigurationFile } from '../models';

    import * as jsyaml from "js-yaml";
/**
 * YAML utils
 */
export class YamlUtils{
    private  getFileFolder(uri: vscode.Uri): vscode.Uri {
        return vscode.Uri.parse(path.dirname(uri.fsPath)) ?? uri;
	}
    private getRootFolder(): vscode.Uri | undefined {
        if (vscode.workspace.workspaceFile === undefined) {
			console.log('No workspace opened');
            return undefined;
        }
        return this.getFileFolder(vscode.workspace.workspaceFile);
    }
    public gma(): vscode.Uri | undefined {
        const rootFolder =  this.getRootFolder();
        if (rootFolder === undefined) {
			console.log('No workspace opened');
            return undefined;
        }
        return vscode.Uri.joinPath(rootFolder, Constants.workspaceGmaYaml);
    }
    /**
     * Load data from configuration file `gma.yaml`
     * to be used by extension
     * 
     * @returns {GmaConfigurationFile | undefined}
     */
    public load(): GmaConfigurationFile | undefined {
        try{
            const filePath = this.gma()?.fsPath;
            if (filePath === undefined) {
                return undefined;
            }
            const yamlFile = fs.readFileSync(filePath, 'utf8');
            const value : IGmaConfigurationFile = jsyaml.load(yamlFile, {
               json: true
            } as jsyaml.LoadOptions) as IGmaConfigurationFile;
            console.log(value);
            // const value = tsyaml.parse(yamlFile, { 
            //     prettyErrors: true,
            //     mapAsMap: true,
            //     sortMapEntries: true,
            // } as tsyaml.Options);
            const iapps = value.apps;
            const apps: GmaAppConfiguration[] = iapps.map(app => this.convertApp(app)) ?? [];
            return new GmaConfigurationFile({
                name: value.name,
                description: value.description,
                packages: value.packages,
                apps:apps,
                runners: value.runners?.map((runner: GmaConfigurationRunner)=> new GmaConfigurationRunner({
                    name: runner.name,
                    run: runner.run,
                    description: runner.description,
                })) ?? [],});
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
    private convertApp(app: IGmaAppConfiguration): GmaAppConfiguration {
        try{
            const excl = new Map<string, boolean>();
                    console.log(``);

                    if (app.exclude_packages !== undefined) {
                        excl.set('capp',app.exclude_packages.capp);
                        excl.set('mapp',app.exclude_packages.mapp);
                        excl.set('koyal',app.exclude_packages.koyal);
                    }
                    const ax = new GmaAppConfiguration({
                        packageName: '',
                        title:'',
                    version: '',
                    description: '',
                    folder: '',
                    stages: [],
                    countries: [],
                    exclude: new Map<string,boolean>([['capp',true],['mapp',true],['koyal',true]]),
                    port: app.port,
                    });
                    console.log(ax);
                return new GmaAppConfiguration({
                    packageName: app.package_name,
                    title: app.title,
                    version: app.version,
                    description: app.description,
                    folder: app.folder,
                    stages: app.stages,
                    countries: app.countries,
                    exclude: excl,
                    port: app.port,
                });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    
}