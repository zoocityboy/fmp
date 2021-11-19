import * as vscode from 'vscode';
import { scanFile as scanFilesystem } from './build_runner_files';
import { Process } from './build_runner_process';
import { NestTreeItem, NestTreeProvider } from './build_runner_tree';
import { TreeModel } from '../../models/dto/pubspec';
import { Constants } from '../../models/constants';
export async function registerBuildRunner(context: vscode.ExtensionContext,) {

    vscode.window.registerTreeDataProvider(Constants.gmaBuildRunnerView, NestTreeProvider.instance);

    const register = (command: string, callback: (...args: any[]) => any, thisArg?: any) => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, callback, thisArg));
    };

    register(Constants.gmaCommandBuildRunnerWatch, (args: NestTreeItem) => Process.instance.create(args, 'watch'));
    register(Constants.gmaCommandBuildRunnerBuild, (args: NestTreeItem) => Process.instance.create(args, 'build'));
    register(Constants.gmaCommandBuildRunnerTerminate, (args: NestTreeItem) => Process.instance.terminate(args));

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