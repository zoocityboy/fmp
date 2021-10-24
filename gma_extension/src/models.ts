import { QuickInputButton, QuickPickItem, TaskDefinition, Uri } from 'vscode';
export interface Selectable extends QuickPickItem {
    key: string;
    toConfiguration(): Object;
}
export class App implements Selectable {
    label: string;
    description?: string;
    key: string;
    exclude: Object;
    picked?: boolean;

    constructor(label: string, key: string, exclude: Object, picked?: boolean, description?: string,) {
        this.label = label; //this.label = this.picked === true ? `$(star-full) ${label}` : `$(star-empty) ${label}`; 
        this.description = description;
        this.key = key;
        this.picked = picked;
        this.exclude = exclude;

    }
    toConfiguration(): Object {
        return { "label": this.label, "description": this.description, "key": this.key, "exclude": this.exclude, "picked": this.picked ?? false };
    }
    static toModel(item: never): App {
        return new App(item['label'], item['key'], item['exclude'], item['picked'], item['description']);
    }
}
export class Country implements Selectable {
    label: string;
    key: string;
    picked?: boolean;
    constructor(label: string, key: string, picked?: boolean) {
        this.label = label; //this.label = this.picked === true ? `$(star-full) ${label}` : `$(star-empty) ${label}`; 
        this.key = key;
        this.picked = picked;

    }
    toConfiguration(): Object {
        return { "label": this.label, "key": this.key, "picked": this.picked ?? false };
    }
    static toModel(item: never): Country {
        return new Country(item['label'], item['key'], item['picked']);
    }
}
export class Stage implements Selectable {
    label: string;
    key: string;
    picked?: boolean;
    constructor(label: string, key: string, picked?: boolean) {
        this.label = label; //this.label = this.picked === true ? `$(star-full) ${label}` : `$(star-empty) ${label}`; 
        this.key = key;
        this.picked = picked;

    }
    toConfiguration(): Object {
        return { "label": this.label, "key": this.key, "picked": this.picked ?? false };
    }
    static toModel(item: never): Stage {
        return new Stage(item['label'], item['key'], item['picked']);
    }
}
export enum ProgressState {
    default,
    loading,
    complete
}

export interface ConfiguratorChangeEvent {
    readonly message: string | undefined;
    readonly failed: Error | undefined;
    readonly state: ProgressState
}
export interface TaskChangeEvent extends ConfiguratorChangeEvent { }

export interface LaunchConfiguration {
    args: string[];
    name: string;
    program: string;
    request: string;
    type: string;
}