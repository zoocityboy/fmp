import { ProgressStatus as ProgressStatus } from "../dto/ProgressState";
import { IState } from "./IState";
import * as vscode from 'vscode';

export interface IMessageEvent {
    readonly message: string | undefined;
    readonly failed: Error | undefined;
    readonly value: IState | undefined;
    readonly status: ProgressStatus
}

export class MessageHandler{
    public onDidChanged: vscode.EventEmitter<IMessageEvent> = new vscode.EventEmitter<IMessageEvent>();
    public message(val: {
        status: ProgressStatus,
        message?: string | undefined,
        value?: IState | undefined,
        error?: Error | unknown
    }) {
        let _message = {
            message: val.message,
            failed: val.error,
            status: val.status,
            value: val.value
        } as IMessageEvent;
        this.onDidChanged.fire(_message);
    }
}