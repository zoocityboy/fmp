import * as vscode from 'vscode';
import * as yaml from 'yaml';
import { Constants } from '../constants';
import { PubspecModel, TreeModel } from './models/pubspec';

const readYaml = async (uri: vscode.Uri) => {
    const uint8Array = await vscode.workspace.fs.readFile(uri);
    let json: PubspecModel | null;
    try {
        json = yaml.parse(uint8Array.toString());
    } catch (error) {
        json = null;
    }
    return json;
};

export const scanFile = async (): Promise<TreeModel[]> => {

    const workspaces = vscode.workspace.workspaceFolders ?? [];

    const filtred = workspaces.filter(value => [Constants.pluginsFolder, Constants.packagesFolder].includes(value.name));

    const effectListPromises = filtred.map(async (workspace) => {

        const relativePattern = new vscode.RelativePattern(workspace.uri, '**/pubspec.yaml');
        const pubspecUris = await vscode.workspace.findFiles(relativePattern);

        const pubspecObjsPromises = pubspecUris.map((uri) => readYaml(uri));
        const pubspecObjs = await Promise.all(pubspecObjsPromises);
        const effectList = pubspecObjs.filter((e) => {
            return (
                Object.keys(e?.dependencies ?? {}).includes('build_runner') ||
                Object.keys(e?.dev_dependencies ?? {}).includes('build_runner')
            );
        });
        const ret: TreeModel = {
            name: workspace.name,
            uri: workspace.uri,
            children: effectList.map((e, i) => {
                console.log(`pubspec: ${e!.name} ${pubspecUris[i]}`);
                return {
                    name: e!.name,
                    uri: pubspecUris[i],
                };
            }),
        };
        return ret;

    });

    const ret = Promise.all(effectListPromises);

    return ret;
};