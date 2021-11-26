import { TreeItem, Uri, TreeItemCollapsibleState, ThemeIcon } from 'vscode';

/**
 * Node for tree view
 */
export interface TreePathNode {
    name: string;
    children: TreePathNode[];
}
/**
 * Tree view node used by vscode.TreeDataProvider
 */
export class NestTreePathItem extends TreeItem {
    constructor(
        public readonly title: string,
        public readonly parentUri: Uri,
        public readonly resourceUri: Uri,
        public readonly children?: NestTreePathItem[],
    ) {
        super(title, children ? TreeItemCollapsibleState.Expanded : undefined);
    }
    private isDir = this.children ? 'dir' : 'file';

    readonly contextValue = this.children ? 'dir' : 'file';

    readonly command =
        this.isDir === 'file'
            ? {
                title: 'Open file',
                command: 'vscode.open',
                arguments: [this.resourceUri],
                iconPath: new ThemeIcon('variables-view-icon')
            }
            : undefined;

    readonly tooltip = `${this.resourceUri?.path}`;
}
/**
 * Convert glob to tree view
 */
export class GlobToTree{
    private createNode(path: string[], tree: TreePathNode[]) {
        const name = path.shift();
        const idx = tree.findIndex(function (e) {
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
        const tree: TreePathNode[] = [];
        for (let i = 0; i < data.length; i++) {
            const path = data[i];
            const split = path.split('/');
            this.createNode(split, tree);
        }
        return tree;
    }
}