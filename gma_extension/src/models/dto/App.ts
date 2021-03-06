import { QuickPickItem } from "vscode";
import { IItem } from "../interfaces/i_item";
/**
 * QuickPickItem extension for `IItem` used by multistep selector
 * keeps data about application item
 * 
 * @class App 
 */
export class App  implements IItem {
    title: string;
    description?: string;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;
    key: string;
    icon?: string | undefined;
    folder?: string | undefined;
    exclude?: Map<string,boolean> | undefined;

    constructor(val: {key: string,icon?: string, title: string, detail?: string, picked?: boolean, alwaysShow?: boolean, folder?: string, exclude?: Map<string,boolean>,}) {
        this.key = val.key;
        this.icon = val.icon;
        this.title = val.title;
        this.detail = val.detail;
        this.picked = val.picked;
        this.alwaysShow = val.alwaysShow;
        this.folder = val.folder;
        this.exclude = val.exclude;
    }
    get asQuickPickItem(): QuickPickItem {
       return {
           label: this.label,
           detail: this.detail,
           picked: this.picked,
           alwaysShow: this.alwaysShow,
       } as QuickPickItem;
    }
    
    get label(): string {
        return this.icon !== undefined ? this.icon + " " + this.title : this.title;
    }
    
    public static fromKey(key: string | undefined): App {
        return listOfApps.find(value => value.key === key) || listOfApps[0];
    }
}

// @Deprecated - obsolete usage, use definition from gma.yaml
export const listOfApps: App[] = [
    new App({key: "self_care", title: "Customer", detail: "Application used by Customers of HCI.",folder: "capp", 
        exclude: new Map([
            ["capp", false],
            ["mapp", true],
            ["koyal", false],
        ])
    },),
    new App({key: "mapp", title: "Merchant", detail: "Application used by Merchants for managing POS.",folder: "mapp", 
        exclude: new Map([
            ["capp", true],
            ["mapp", false],
            ["koyal", false],
        ])
    }),
];

export class GmaApp{
    name: string;
    path: string;
    constructor(val: {name: string, path: string}) {
        this.name = val.name;
        this.path = val.path;
    }
}

export enum LauncherType{
    app = "GMA_APP",
    test = "GMA_TEST",	
    tests = "GMA_TESTS"	
}