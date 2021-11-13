import { QuickPickItem } from "vscode";
import { IItem } from "../interfaces/ISelectable";

export class Stage implements IItem{
    key: string;
    icon?: string | undefined;
    label: string;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;
    folder?: string | undefined;

    constructor(val: {key: string, icon?: string, label: string, detail?: string, picked?: boolean, alwaysShow?: boolean, folder?: string}) {
        this.key = val.key;
        this.icon = val.icon;
        this.label = val.label;
        this.detail = val.detail;
        this.picked = val.picked;
        this.alwaysShow = val.alwaysShow;
        this.folder = val.folder;
    }
    get labelWithIconPrefix(): string {
        throw new Error("Method not implemented.");
    }
    description?: string | undefined;
   
        
    public static fromKey(key: string | undefined): Stage {
        return listOfStages.find(value => value.key === key) ?? listOfStages[0];
    }
}
export const listOfStages: Stage[] = [
    new Stage({key: "fake", label: "Fake", detail:"Development stage without connection to the real APIs."}),
    new Stage({key: "prod", label: "Production", detail: "Testing stage with connection to production APIs."}),
];