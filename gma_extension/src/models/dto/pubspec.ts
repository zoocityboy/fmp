import * as vscode from "vscode";
/**
 * The pubspec.yaml file.
 * contains only necessary keys for the extension.
 */
export interface PubspecModel {
    name: string;
    dependencies: {
        [key: string]: Object | string;
    };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    dev_dependencies: {
        [key: string]: Object | string;
    };
}

export interface PubspecTreeModel {
    workspace: vscode.WorkspaceFolder;
    pubspec: PubspecTreePubspecModel[];
}

export interface PubspecTreePubspecModel {
    uri: vscode.Uri;
    name: string | null;
}

export interface TreeModel {
    name: string;
    uri: vscode.Uri;
    children?: TreeModel[] | undefined;
}