import * as vscode from "vscode";
import * as fs from "fs";
import { Constants } from "../../models/constants";
import { HelpTreeItem, HelpTreeItemData } from "../../models";

export class HelpTreeProvider implements vscode.TreeDataProvider<HelpTreeItem>{
    private readonly _extensionUri: vscode.Uri;
    private items: HelpTreeItem[] = [];
    private constructor(extensionUri: vscode.Uri) { 
        this._extensionUri = extensionUri;
        const dataPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'data','help.json');
        const data = fs.readFileSync(dataPath.fsPath, 'utf8');
        this.items = this.parseJson(data);
    }
    private parseJson(json: string): HelpTreeItem[] {
        let result: HelpTreeItem[] = [];
        let jsonObj = JSON.parse(json);
        for (let i = 0; i < jsonObj.length; i++) {
            let item:HelpTreeItemData = jsonObj[i];
            result.push(new HelpTreeItem(item.name, item));
        }
        return result;
    }

    onDidChangeTreeData?: vscode.Event<void | HelpTreeItem | null | undefined> | undefined;
    getTreeItem(element: HelpTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return Promise.resolve(element);
    }
    getChildren(element?: HelpTreeItem): vscode.ProviderResult<HelpTreeItem[]> {
        return Promise.resolve(this.items);
    }
    static register(context: vscode.ExtensionContext) {
        const treeDataProvider = new HelpTreeProvider(context.extensionUri);
        vscode.window.createTreeView(Constants.gmaHelpQuicklinksView, { treeDataProvider , showCollapseAll: true , canSelectMany: true });
    }
    
}   