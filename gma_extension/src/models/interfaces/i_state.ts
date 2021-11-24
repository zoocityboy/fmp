import { App } from "../dto/app";
import { Country } from "../dto/country";
import { Stage } from "../dto/stage";
/**
 * Interface for the state of the buildFlow
 * used for update flavor and build
 */
export interface IState {
    step: number;
    totalSteps: number;
    app: App | undefined;
    country: Country | undefined;
    stage: Stage | undefined;
}