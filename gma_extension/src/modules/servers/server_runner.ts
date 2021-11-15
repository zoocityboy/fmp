import * as vscode from "vscode";

export interface ServerModel{
    id: string;
    name: string;
    uri: vscode.Uri;
    pid: number | null;
}
export class ServerTreeItem extends vscode.TreeItem{
    constructor(
        public readonly title: string,
        public readonly model: ServerModel,
        
    ){
        super(title, vscode.TreeItemCollapsibleState.None);
    }
}
export class ServerTreeProvider implements vscode.TreeDataProvider<ServerModel>{
    private constructor() { }

    private static _instance: ServerTreeProvider;
    static get instance() {
        this._instance ??= new ServerTreeProvider();
        return this._instance;
    }
    onDidChangeTreeData?: vscode.Event<void | ServerModel | null | undefined> | undefined;
    getTreeItem(element: ServerModel): vscode.TreeItem | Thenable<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }
    getChildren(element?: ServerModel): vscode.ProviderResult<ServerModel[]> {
        throw new Error("Method not implemented.");
    }

}