import { QuickPickItem } from "vscode";

export interface IItem extends QuickPickItem {
    key: string;
    icon?: string | undefined;
    folder?: string | undefined;
    get asQuickPickItem(): QuickPickItem;
}