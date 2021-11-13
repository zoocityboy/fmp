import { ISelectable } from "../interfaces/ISelectable";

export class SelectableStage implements ISelectable {
    label: string;
    detail?: string;
    key: string;
    picked?: boolean;
    constructor(label: string, key: string, picked?: boolean, detail?: string,) {
        this.label = label; //this.label = this.picked === true ? `$(star-full) ${label}` : `$(star-empty) ${label}`; 
        this.key = key;
        this.picked = picked;
        this.detail = detail;

    }
    toConfiguration(): Object {
        return { "label": this.label, "key": this.key, "picked": this.picked ?? false, "detail": this.detail };
    }
    static toModel(item: never): SelectableStage {
        return new SelectableStage(item['label'], item['key'], item['picked'], item['detail']);
    }
}