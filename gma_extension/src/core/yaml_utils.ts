import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as tsyaml from 'yaml';
import { Constants } from '../models/constants';
import { 
    GmaAppConfiguration,GmaConfigurationRunner, GmaConfigurationFile, IGmaAppConfiguration } from '../models';
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
            const yamlFile = fs.readFileSync(filePath!, 'utf8');
            const value = tsyaml.parse(yamlFile);

            return new GmaConfigurationFile({
                name: value.name,
                description: value.description,
                packages: value.packages,
                apps: value.apps.map((app: IGmaAppConfiguration) => {
                    const excl = new Map<string, boolean>();
                   console.log(``);

                    // conso
                    if (app.exclude_packages !== undefined) {
                        excl.set('capp',app.exclude_packages.capp);
                        excl.set('mapp',app.exclude_packages.mapp);
                        excl.set('koyal',app.exclude_packages.koyal);
                    }
                    
                    return new GmaAppConfiguration({
                        packageName: app.package_name,
                        title: app.title,
                        version: app.version,
                        description: app.description,
                        folder: app.folder,
                        flavor: app.flavor,
                        stages: app.stages,
                        countries: app.countries,
                        exclude: excl,
                        port: app.port,
                    });
                }),
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
    
}