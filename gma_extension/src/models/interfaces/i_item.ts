import { QuickPickItem } from "vscode";
/**
 * Interface for the Item model
 * @interface IItem
 * @extends {QuickPickItem}
 * @property {string} key - The item's unique id
 * @property {string | undefined}  - The item's icon vscode.ThemeIcon
 * @property {string| undefined} folder - The item's folder property
 */
export interface IItem extends QuickPickItem {
    key: string;
    icon?: string | undefined;
    folder?: string | undefined;
    get asQuickPickItem(): QuickPickItem;
}