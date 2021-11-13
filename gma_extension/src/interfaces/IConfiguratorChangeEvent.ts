import { ProgressState } from "../models/ProgressState";

export interface IConfiguratorChangeEvent {
    readonly message: string | undefined;
    readonly failed: Error | undefined;
    readonly state: ProgressState
}