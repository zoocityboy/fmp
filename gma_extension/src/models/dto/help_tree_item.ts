
import * as vscode from "vscode";
/**
 * Help tree item for a help topic.
 * used by HelpTreeDataProvider
 */
export interface HelpTreeItemData{
    id: string,
    name: string,
    url: string,
    iconName?: string,
}
export class HelpTreeItem extends vscode.TreeItem{
    id: string;
    name: string;
    uri: vscode.Uri;
    iconName: string;
    public contextValue: string = 'help';
    constructor(
        label: string,
        args: HelpTreeItemData
    ){
        super(label, vscode.TreeItemCollapsibleState.None);
        this.command = {
            command: 'vscode.open',
            title: 'Open',
            arguments: [vscode.Uri.parse(args.url)]
        } as vscode.Command;
        this.id = args.id;
        this.name = args.name;
        this.uri = vscode.Uri.parse(args.url);
        this.tooltip = `${this.name}`;
        this.iconName = args.iconName ?? 'book';
        this.iconPath = new vscode.ThemeIcon(this.iconName);
    }
}