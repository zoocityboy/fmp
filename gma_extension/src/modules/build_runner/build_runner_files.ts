import * as vscode from 'vscode';
import * as jsyaml from 'js-yaml';
import { PubspecModel, TreeModel } from '../../models/dto/pubspec';
import path = require('path');
export interface IPubspecItem{
    uri: vscode.Uri;
    pubspec: PubspecModel | null;
}
const readYaml = async (uri: vscode.Uri) => {
    const uint8Array = await vscode.workspace.fs.readFile(uri);
    let json: PubspecModel | null;
    try {
        const data = uint8Array.toString();
        json = jsyaml.load(data) as PubspecModel;
    } catch (error) {
        json = null;
    }
    return json;
};

export const scanFile = async (): Promise<TreeModel[]> => {
    const workspaces = vscode.workspace.workspaceFolders ?? [];

    const filtred = workspaces.filter(value => value.name);
    const getData = async (uris: vscode.Uri[]) => {
        const pubspecObjsPromises = uris.map((uri) => readYaml(uri));
        const pubspecObjs = await Promise.all(pubspecObjsPromises);
        const pubspecObjs1: IPubspecItem[] = [];
        pubspecObjs.forEach((value, index) => {
            const data: IPubspecItem = {uri: uris[index], pubspec: value};
            pubspecObjs1.push(data);
        });
        const _filtred = pubspecObjs1.filter(value => Object.keys(value.pubspec?.dev_dependencies ?? {}).includes('build_runner')).sort();
        return _filtred;
    };
    const effectListPromises = filtred.map(async (workspace) => {
        const relativePattern = new vscode.RelativePattern(workspace.uri, '**/pubspec.yaml');
        const pubspecUris = await vscode.workspace.findFiles(relativePattern);
        const _filtred = await getData(pubspecUris);
        const ret: TreeModel = {
            name: workspace.name,
            uri: workspace.uri,
            children: _filtred.map((e) => {
                return {
                    name: path.basename(path.dirname(e.uri.fsPath)),
                    uri: e.uri,
                } as TreeModel;
            }),
        };
        return ret;

    });

    const ret = Promise.all(effectListPromises);

    return ret;
};