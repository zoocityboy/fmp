import { QuickPickItem } from "vscode";
import { IItem } from "../interfaces/ISelectable";

export class Country implements IItem {
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
        return this.icon !== undefined ? this.icon + " " + this.label : this.label;
    }
   
    public static fromKey(key: string | undefined): Country {
        return listOfCountries.find(value => value.key === key) || listOfCountries[0];
    }
}
export const listOfCountries: Country[] = [
    new Country({key: "in", icon: "🇮🇳", label: "India", detail: "Application for Indian marketplace."}),
    new Country({key: "vn", icon: "🇻🇳", label: "Vietnam",detail: "Application for Vietnam marketplace."}),
    new Country({key: "ph", icon: "🇵🇭", label: "Philippines", detail: "Application for Philippines marketplace."}),
    new Country({key: "id", icon: "🇮🇩", label: "Indonesia", detail: "Application for Indonesian marketplace."}),
];