/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as vscode from 'vscode';
import * as path from 'path';
import * as semver from 'semver';
import { Constants } from '../models';
import { Process } from './processes';
export interface IAvailableExtension {
    uri: vscode.Uri;
    name: string;
    version: string,
    isValid: boolean;
}
export class Update{
    private _currentVersion: string | undefined;
    private _availableVersions: IAvailableExtension[] = [];
    private _updateStatusBarItem: vscode.StatusBarItem;
    private _postponed = false;
   
    constructor(private context: vscode.ExtensionContext) {
        this._updateStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this._updateStatusBarItem.command = Constants.gmaCommandUpdateStudio;
        this.context.subscriptions.push(
            this._updateStatusBarItem,
            vscode.commands.registerCommand(Constants.gmaCommandUpdateStudio, ()=> {
                this.runUpdate();
            }));
        this.loadManifest();
        this.runWatcher();
    }

    private get latestVersionToUpdate(): IAvailableExtension | undefined {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const currentVersion = this._currentVersion!;
            const newVersions = this._availableVersions.filter(version => version.isValid && semver.gt(version.version, currentVersion)).sort((a, b) => semver.compare(a.version, b.version));
            if (newVersions.length > 0) {
                return newVersions[newVersions.length - 1];
            }
            return undefined;
    }
    private runUpdate(){
        this.isUpdateAvailable().then(update => {
            /// update
            console.log(`${update}`);
            if (update !== undefined) {
                void this.installUpdate(update);
            }
        }).catch(err => {
            /// error
            console.log(`${err}`);
        }).finally(() => {
            /// finally
            console.log('finally');
        });
    }

    private loadManifest() {
        const ext = vscode.extensions.getExtension('hci.gma.studio');
        const manifest = ext?.packageJSON;
        this._currentVersion  = manifest?.version as string | undefined;
    }

    private async loadAvailableVersions() {
        const rootFolder = path.dirname(vscode.workspace.workspaceFile?.fsPath ?? ''); 
        const pattern  = new vscode.RelativePattern(rootFolder, Constants.gmaGlobPatternToolingFiles);
        const files = await vscode.workspace.findFiles(pattern, '');
        const mapped = files.map(file => {
           const semversion= path.basename(file.fsPath).replace('studio-','').replace('.vsix','');
        return {
             uri: file,
             name: path.basename(file.fsPath),   // 'studio-X.Y.Z-xyz.1.vsix'
             version: semversion, // 'X.Y.Z-xyz.1'
             isValid: semver.valid(semversion) !== null,
         } as IAvailableExtension;
    }).filter(version => version.isValid);
       this._availableVersions.push(...mapped);
    }

    public runWatcher() {
        const rootFolder = path.join( path.dirname(vscode.workspace.workspaceFile?.fsPath ?? ''), 'plugins','gma_tooling' ); 
        const pattern  = new vscode.RelativePattern(rootFolder, Constants.gmaGlobPatternToolingFiles);
        const watcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);
        watcher.onDidChange(async () => {
            await this.isUpdateAvailable();
        });
    }

    public postponeUpdate() {
        const update = this.latestVersionToUpdate;
        if (update !== undefined) {
            this._updateStatusBarItem.text = `$(cloud-download) Update ${update.version}`;
            this._updateStatusBarItem.show();
            this._postponed = true;
        } else {
            this._updateStatusBarItem.hide();
            this._updateStatusBarItem.text = '';
            this._postponed = false;
        }
    }

    public async isUpdateAvailable(): Promise<IAvailableExtension | undefined> {
        await this.loadAvailableVersions();
        return new Promise((resolve, reject) => {
            if (!this._currentVersion) {
                reject(new Error('Current version is undefined'));
            }
            const update = this.latestVersionToUpdate;
            if (update !== undefined) {
                resolve(update);
            } else {
                resolve(undefined);
            }
        });
    }
   
    public installUpdate = (update: IAvailableExtension) => {
        return new Promise((resolve, reject) => {
            Process.instance.runUpdate(update).then(async () => {
                ///
                await vscode.commands.executeCommand('workbench.action.reloadWindow');
                resolve(true);

            }).catch((e) => {
                ///
                reject(e);
            });
        });
    }
}