import * as vscode from 'vscode';
export interface CommandTaskDefinition extends vscode.TaskDefinition {
    name: string;
    description: string;
    run: string[];
  }
