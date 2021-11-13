import { QuickPickItem } from "vscode";
import { IItem } from "../interfaces/ISelectable";

export class App  implements IItem {
    key: string;
    label: string;
    icon?: string | undefined;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;
    folder?: string | undefined;
    exclude: Map<String,boolean>;

    constructor(val: {key: string,icon?: string, label: string, detail?: string, picked?: boolean, alwaysShow?: boolean, folder?: string, exclude: Map<String,boolean>}) {
        this.key = val.key;
        this.icon = val.icon;
        this.label = val.label;
        this.detail = val.detail;
        this.picked = val.picked;
        this.alwaysShow = val.alwaysShow;
        this.folder = val.folder;
        this.exclude = val.exclude;
    }
    
    get labelWithIconPrefix(): string {
        return this.icon !== undefined ? this.icon + " " + this.label : this.label;
    }
    
    public static fromKey(key: string | undefined): App {
        return listOfApps.find(value => value.key === key) || listOfApps[0];
    }
}
export const listOfApps: App[] = [
    new App({key: "self_care", label: "Customer", detail: "Application used by Customers of HCI.",folder: "capp", exclude: new Map([
        ["capp_*/", false,],
          ["mapp_*/", true,],
          ["koyal_*/", false]
    ])}),
    new App({key: "mapp", label: "Merchant", detail: "Application used by Merchants for managing POS.",folder: "mapp", exclude: new Map([
        ["capp_*/", true,],
          ["mapp_*/", false,],
          ["koyal_*/", false]
    ])}),
];