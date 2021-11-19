import * as vscode from "vscode";
import {  YamlUtils } from "../../core/YamlUtils";
import { Constants } from "../../models/constants";
import {GmaAppConfiguration, GmaConfigurationFile} from "../../models";
export class ServerTreeItem extends vscode.TreeItem{
    public contextValue: string = 'server';
    
    constructor(
        public readonly title: string,
        public readonly model: GmaAppConfiguration,
        
    ){
        super(title, vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon("globe");
        this.command = {
            command: model.commandId,
            title: 'Open',
            arguments: [model.url]
        } as vscode.Command;
    }
}
type EventEmitterServerTreeItem = ServerTreeItem | undefined | void;

export class ServerTreeProvider implements vscode.TreeDataProvider<ServerTreeItem>{
    private data: GmaConfigurationFile | undefined;
    private items: ServerTreeItem[] = [];
    private constructor() { 
        this.loadData();
    }
    private loadData(): void {
        const utils = new YamlUtils();
        this.data = utils.load();
        this.data?.servers.forEach((item, index) => {
            this.items.push(new ServerTreeItem(item.title, item));
        });
        
    }
    private static _instance: ServerTreeProvider;
    static get instance() {
        this._instance ??= new ServerTreeProvider();
        return this._instance;
    }
    private readonly eventEmitter = new vscode.EventEmitter<EventEmitterServerTreeItem>();

    readonly refresh = (): void => this.eventEmitter.fire();

    readonly onDidChangeTreeData = this.eventEmitter.event;

    getTreeItem(element: ServerTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return Promise.resolve(element);
    }
    getChildren(element?: ServerTreeItem): vscode.ProviderResult<ServerTreeItem[]> {
        return Promise.resolve(this.items);
    }
    static register(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.window.registerTreeDataProvider(Constants.gmaServersView, ServerTreeProvider.instance));
    }
    dispose() {
     
    }
}