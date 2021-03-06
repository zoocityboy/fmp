import * as vscode from "vscode";
import * as path from 'path';
import { Constants } from "../../models/constants";
import { GlobSync } from "glob";
import { GlobToTree, NestTreePathItem, TreePathNode } from "../../core/glob_to_tree";
type EventEmitterTreeItem = NestTreePathItem | undefined | void;
class GlobTreeProvider implements vscode.TreeDataProvider<NestTreePathItem>{
    public viewId: string = Constants.gmaDocumentationView;
    private pattern = '*(docs|capp|mapp|plugins)/**/*.{md,MD}';
    private items: NestTreePathItem[] = [];
    
    constructor(args: {viewId: string, pattern: string}) {
        this.viewId = args.viewId;
        this.pattern = args.pattern;
        void this.loadData();        
    }
    private async loadData(){
        const nestList = await this.scanFile(this.pattern);
        const recurse = (data: TreePathNode, parentUri: vscode.Uri): NestTreePathItem => {
            const uri = vscode.Uri.file(path.join(parentUri.fsPath, data.name));
            return new NestTreePathItem(
                data.name,
                parentUri,
                uri,
                data.children?.map((e) => recurse(e, uri)),
            );
        };
        const workspaceFile = vscode.workspace.workspaceFile;
        if (workspaceFile !== undefined) {
            this.items = nestList.map((e) => recurse(e, vscode.Uri.file(path.dirname(workspaceFile.fsPath))));
        }
        this.refresh();
    }

    private readonly eventEmitter = new vscode.EventEmitter<EventEmitterTreeItem>();

    readonly refresh = (): void => this.eventEmitter.fire();

    readonly onDidChangeTreeData = this.eventEmitter.event;

    readonly getTreeItem = (element: NestTreePathItem) => element;

    readonly getChildren = (element: NestTreePathItem) => (!element ? this.items : element.children);
    
    private scanFile = async (pattern: string): Promise<TreePathNode[]> => {
        if (vscode.workspace.workspaceFile === undefined) {
            return Promise.resolve([]);
        }
    
        const rootDir = path.dirname(vscode.workspace.workspaceFile.fsPath);
        const files = new GlobSync(pattern,{
            cwd: rootDir,
        });
        const filtered = files.found.filter((e) => !e.includes('/ios/'));
        
        let result: TreePathNode[] = [];
        try{
            const converter = new GlobToTree();
            result = converter.parse(filtered);
        }catch(e){
            console.log(e);
        }
        return Promise.all(result);;
    };
}   
export class GlobExplorer {
    constructor(context: vscode.ExtensionContext, args: {viewId: string, pattern: string}) {
        const treeDataProvider = new GlobTreeProvider(args);
        context.subscriptions.push(
            vscode.window.createTreeView<NestTreePathItem>(treeDataProvider.viewId, {treeDataProvider: treeDataProvider, showCollapseAll:true})
            );
    }
}