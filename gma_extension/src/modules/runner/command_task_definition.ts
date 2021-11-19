
import * as vscode from 'vscode';
export interface CommandTaskDefinition extends vscode.TaskDefinition {
    /**
     * The task name
     */
    task: string;
  
    /**
     * command arguments
     */
    args: string[];
  }
