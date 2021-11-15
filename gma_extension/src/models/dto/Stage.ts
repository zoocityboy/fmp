import { QuickPickItem } from "vscode";
import { IItem } from "../interfaces/IItem";

export class Stage implements IItem{
    title: string;
    description?: string;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;
    ///
    key: string;
    icon?: string | undefined;

    constructor(val: {key: string,icon?: string, title: string, detail?: string, picked?: boolean, alwaysShow?: boolean}) {
        this.key = val.key;
        this.icon = val.icon;
        this.title = val.title;
        this.detail = val.detail;
        this.picked = val.picked;
        this.alwaysShow = val.alwaysShow;
    }
    get label(): string {
        return this.icon !== undefined ? this.icon + " " + this.title : this.title;
    }
    get asQuickPickItem(): QuickPickItem {
        return {
            label: this.label,
            description: this.description,
            detail: this.detail,
            picked: this.picked,
            alwaysShow: this.alwaysShow,
        } as QuickPickItem;
     }
    
   
        
    public static fromKey(key: string | undefined): Stage {
        return listOfStages.find(value => value.key === key) ?? listOfStages[0];
    }
}
export const listOfStages: Stage[] = [
    new Stage({key: "fake", title: "Fake", detail:"Development stage without connection to the real APIs."}),
    new Stage({key: "prod", title: "Production", detail: "Testing stage with connection to production APIs."}),
];