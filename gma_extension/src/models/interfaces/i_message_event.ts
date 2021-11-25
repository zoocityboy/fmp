import { ProgressStatus as ProgressStatus } from "../dto/progress_state";
import { IState } from "./i_state";
import * as vscode from 'vscode';
/**
 * Internal message event.
 */
export interface IMessageEvent {
    readonly message: string | undefined;
    readonly failed: Error | undefined;
    readonly value: IState | undefined;
    readonly status: ProgressStatus
}
/**
 * Internal messaging handler.
 */
export class MessageHandler{
    public onDidChanged: vscode.EventEmitter<IMessageEvent> = new vscode.EventEmitter<IMessageEvent>();
    public message(val: {
        status: ProgressStatus,
        message?: string | undefined,
        value?: IState | undefined,
        error?: Error | unknown
    }) {
        const _message = {
            message: val.message,
            failed: val.error,
            status: val.status,
            value: val.value
        } as IMessageEvent;
        this.onDidChanged.fire(_message);
    }
}