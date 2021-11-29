import path = require('path');
import * as vscode from 'vscode';
import { Process } from '../../core';
import { Constants } from '../../models';

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
    
    private commandId = `build:${path.dirname(this.resourceUri.fsPath)}`;
    private isRunning = Process.I.isProcessRunning(this.commandId);
    private isDirectory = this.children?.length ?? 0 > 0;
    readonly contextValue = this.isDirectory ? 'dir' : this.isRunning ? Constants.gmaContextBuildRunnerWatch : 'file';
    
    readonly command =
        !this.isDirectory
            ? {
                title: 'Open file',
                command: 'vscode.open',
                arguments: [this.resourceUri],
                iconPath: new vscode.ThemeIcon('variables-view-icon')
            }
            : undefined;
    readonly iconPath = this.isRunning ? new vscode.ThemeIcon('symbol-event') : this.isDirectory ? new vscode.ThemeIcon('folder-active') : new vscode.ThemeIcon('gear');

    readonly tooltip = `${this.resourceUri?.path}`;
}