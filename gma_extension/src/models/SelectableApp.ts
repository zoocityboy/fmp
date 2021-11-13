import { ISelectable } from "../interfaces/ISelectable";

export class SelectableApp implements ISelectable {
    label: string;
    detail?: string;
    key: string;
    exclude: Object;
    picked?: boolean;

    constructor(label: string, key: string, exclude: Object, picked?: boolean, detail?: string,) {
        this.label = label; //this.label = this.picked === true ? `$(star-full) ${label}` : `$(star-empty) ${label}`; 
        this.detail = detail;
        this.key = key;
        this.picked = picked;
        this.exclude = exclude;

    }
    toConfiguration(): Object {
        return { "label": this.label, "detail": this.detail, "key": this.key, "exclude": this.exclude, "picked": this.picked ?? false };
    }
    static toModel(item: never): SelectableApp {
        return new SelectableApp(item['label'], item['key'], item['exclude'], item['picked'], item['detail']);
    }
}