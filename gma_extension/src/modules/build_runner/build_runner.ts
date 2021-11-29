import * as vscode from 'vscode';
import { scanFile as scanFilesystem } from './build_runner_files';
import { Process } from '../../core/processes';
import { NestTreeItem, NestTreeProvider } from './build_runner_tree';
import { TreeModel } from '../../models/dto/pubspec';
import { Constants } from '../../models/constants';
import path = require('path');
export async function registerBuildRunner(context: vscode.ExtensionContext,) {

    vscode.window.registerTreeDataProvider(Constants.gmaBuildRunnerView, NestTreeProvider.instance);

    const register = (command: string, callback: (...args: any[]) => any, thisArg?: any) => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, callback, thisArg));
    };

    register(Constants.gmaCommandBuildRunnerWatch, (args: NestTreeItem) =>{
        void Process.I.runBuildRunner({
            type: 'watch',
            uri: args.resourceUri,
        });
        NestTreeProvider.instance.refresh();
    });

    register(Constants.gmaCommandBuildRunnerBuild, (args: NestTreeItem) => { 
        void Process.I.runBuildRunner({
            type: 'build',
            uri: args.resourceUri,
        });
        NestTreeProvider.instance.refresh();
    });

    register(Constants.gmaCommandBuildRunnerTerminate, async (args: NestTreeItem) => {
        const commandId = `build:${path.dirname(args.resourceUri.fsPath)}`;
        await Process.I.terminate(commandId);
        NestTreeProvider.instance.refresh();
    });

    const nestList = await scanFilesystem();

    const recurse = (data: TreeModel): NestTreeItem => {
        return new NestTreeItem(
            data.name,
            data.uri,
            data.children?.map((e) => recurse(e))
        );
    };

    NestTreeProvider.instance.treeList = nestList.map((e) => recurse(e));
    NestTreeProvider.instance.refresh();
}