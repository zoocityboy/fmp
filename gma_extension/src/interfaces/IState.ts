import { QuickPickItem } from "vscode";
import { App } from "../models/app";
import { Country } from "../models/country";
import { Stage } from "../models/stage";

export interface IState {
    title: string;
    step: number;
    totalSteps: number;
    resourceGroup: QuickPickItem | string;
    name: string;
    runtime: QuickPickItem;
    app: App;
    stage: Stage;
    country: Country;

}