
import * as vscode from 'vscode';
export interface TreePathNode {
    name: string;
    children: TreePathNode[];
}
export class NestTreePathItem extends vscode.TreeItem {
    constructor(
        public readonly title: string,
        public readonly parentUri: vscode.Uri,
        public readonly resourceUri: vscode.Uri,
        public readonly children?: NestTreePathItem[],
    ) {
        super(title, children ? vscode.TreeItemCollapsibleState.Expanded : undefined);
    }
    private isDir = this.children ? 'dir' : 'file';

    readonly contextValue = this.children ? 'dir' : 'file';

    readonly command =
        this.isDir === 'file'
            ? {
                title: 'Open file',
                command: 'vscode.open',
                arguments: [this.resourceUri],
                iconPath: new vscode.ThemeIcon('variables-view-icon')
            }
            : undefined;

    readonly tooltip = `${this.resourceUri?.path}`;
}

export class GlobToTree{
    constructor() {
        
    }
    private createNode(path: string[], tree: TreePathNode[]) {
        var name = path.shift();
        var idx = tree.findIndex(function (e) {
            return e.name === name;
        });
        if (idx < 0) {
            tree.push({
                name: name,
                children: path.length !== 0 ? [] : undefined
            } as TreePathNode);
            if (path.length !== 0) {
                this.createNode(path, tree[tree.length - 1].children);
            }
        }
        else {
            this.createNode(path, tree[idx].children);
        }
    }
    public parse(data: string[]) : TreePathNode[] {
        var tree: TreePathNode[] = [];
        for (var i = 0; i < data.length; i++) {
            var path = data[i];
            var split = path.split('/');
            this.createNode(split, tree);
        }
        return tree;
    }
}