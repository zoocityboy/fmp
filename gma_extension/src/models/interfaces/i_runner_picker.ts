import { QuickPickItem } from "vscode";

export interface RunnerPickItem extends QuickPickItem {
    label: string;
    description?: string | undefined;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;
    run: string[];
  }