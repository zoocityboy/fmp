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
        const pubspecObjs1 = new Array();
        pubspecObjs.forEach((value, index) => {
            pubspecObjs1.push([pubspecUris[index], value]);
        });
        const _filtred = pubspecObjs1.filter(value => Object.keys(value[1]?.dev_dependencies ?? {}).includes('build_runner')).sort();
        const ret: TreeModel = {
            name: workspace.name,
            uri: workspace.uri,
            children: _filtred.map((e, i) => {
                return {
                    name: e[1].name,
                    uri: e[0],
                };
            }),
        };
        return ret;

    });

    const ret = Promise.all(effectListPromises);

    return ret;
};