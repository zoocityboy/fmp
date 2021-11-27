import * as vscode from 'vscode';
export interface IFolder{
    uri: vscode.Uri;
    name?: string | undefined;
}