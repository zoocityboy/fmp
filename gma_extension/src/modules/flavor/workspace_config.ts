import { YamlUtils } from "../../core";
import { App, Constants, GmaAppConfiguration, GmaConfigurationFile, GmaConfigurationRunner, IFolder } from "../../models";
import * as vscode from 'vscode';
import path = require("path");

export class GmaConfig{
    private _configuration: GmaConfigurationFile | undefined;
    private static _instance: GmaConfig;
    private _isEnabledAddingToCustomFolders = false;

    public static get i() {
        this._instance = this._instance ?? new GmaConfig();
        return this._instance;
    }
    constructor(){
        this.load();
    }
    get isEnabledAddingToCustomFolders(): boolean {
        return this._isEnabledAddingToCustomFolders;
    }
    public enableAddingToCustomFolders(){
        this._isEnabledAddingToCustomFolders = true;
    }
    public disableAddingToCustomFolders(){
        this._isEnabledAddingToCustomFolders = false;
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

    get isWorkspace(): boolean {
        return vscode.workspace.workspaceFile !== undefined;
    }
    get workspaceDirUri(): vscode.Uri {
        return vscode.Uri.parse(this.workspaceDirFsPath);
    }
    private get workspaceFsPath() : string {
        return vscode.workspace.workspaceFile?.fsPath ?? '';
    }
    get workspaceDirFsPath() : string {
        return path.dirname(this.workspaceFsPath ?? '');
    }
    get worspaceCountryKey(): string {
        const countryId = vscode.workspace.getConfiguration().get<string>(Constants.gmaConfigBuildSelectedCountry, Constants.defaultCountryKey);
        return this.getWorkspaceCountryKey(countryId);
    }

    public getWorkspaceCountryKey(countryId: string): string {
        return `${Constants.gmaConfigWorkspaceFoldersPrefix}${countryId}`;
    }

    public isCustomWorkspaceAvailable(countryId?: string | undefined): boolean {
        const countryKey = countryId !== undefined ? this.getWorkspaceCountryKey(countryId) : this.worspaceCountryKey;
        return vscode.workspace.getConfiguration().get<string[]>(countryKey, []).length > 0;
    }

    public folderConverter(rootUri: vscode.Uri, value: string): IFolder {
        const uri = vscode.Uri.file(path.join(rootUri.path, value))
        const diranme = path.basename(uri.fsPath);
        return {
            uri: uri,
            name: diranme
        } as IFolder;
    }
}