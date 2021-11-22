import { QuickInputButton, QuickPickItem } from "vscode";
/**
 * Interface for quick pick parameters used by buildFlow
 */
export interface IQuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    placeholder: string;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}
