import * as vscode from 'vscode';

type EventEmitterTreeItem = NestTreeItem | undefined | void;

export class NestTreeProvider implements vscode.TreeDataProvider<NestTreeItem> {
    private static _instance: NestTreeProvider;
    static get instance() {
        this._instance ??= new NestTreeProvider();
        return this._instance;
    }

    private readonly eventEmitter = new vscode.EventEmitter<EventEmitterTreeItem>();

    readonly refresh = (): void => this.eventEmitter.fire();

    treeList: NestTreeItem[] = [];

    readonly onDidChangeTreeData = this.eventEmitter.event;

    readonly getTreeItem = (element: NestTreeItem) => element;

    readonly getChildren = (element: NestTreeItem) => (!element ? this.treeList : element.children);
}

export class NestTreeItem extends vscode.TreeItem {
    constructor(
        public readonly title: string,
        public readonly resourceUri: vscode.Uri,
        public readonly children?: NestTreeItem[],


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