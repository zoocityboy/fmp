import { QuickPickItem } from "vscode";

export interface ISelectable extends QuickPickItem {
    key: string;
    toConfiguration(): Object;
}
export interface IItem extends QuickPickItem {
    key: string;
    icon?: string | undefined;
    folder?: string | undefined;
    get labelWithIconPrefix(): string;
}