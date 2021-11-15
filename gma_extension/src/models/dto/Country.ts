import { QuickPickItem } from "vscode";
import { IItem } from "../interfaces/IItem";

export class Country implements IItem {
    title: string;
    description?: string;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;
     ///
     key: string;
     icon?: string | undefined;

    constructor(val: {key: string, icon?: string, title: string, detail?: string, picked?: boolean, alwaysShow?: boolean}) {
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
   
    public static fromKey(key: string | undefined): Country {
        return listOfCountries.find(value => value.key === key) || listOfCountries[0];
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
}
export const listOfCountries: Country[] = [
    new Country({key: "in", icon: "🇮🇳", title: "India", detail: "Application for Indian marketplace."}),
    new Country({key: "vn", icon: "🇻🇳", title: "Vietnam",detail: "Application for Vietnam marketplace."}),
    new Country({key: "ph", icon: "🇵🇭", title: "Philippines", detail: "Application for Philippines marketplace."}),
    new Country({key: "id", icon: "🇮🇩", title: "Indonesia", detail: "Application for Indonesian marketplace."}),
];