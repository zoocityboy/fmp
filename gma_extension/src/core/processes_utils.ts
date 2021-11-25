import * as vscode from 'vscode';
import { wait } from '../extension';

export interface OutputTaskParams {
    title: string;
    onDispose: () => void;
}

export interface OutputTask {
    id?: number;
    show: () => void;
    hide: () => void;
    isShow: () => Promise<boolean>;
    write: (value: string) => void;
    activate: () => void;
    invalidate: () => void;
}

export const createOutput = async (title: string, onDispose: () => void): Promise<OutputTask> => {
    let invalid = false;

    const writeEmitter = new vscode.EventEmitter<string>();
    const pty: vscode.Pseudoterminal = {
        onDidWrite: writeEmitter.event,
        open() { 
            ///
        },
        handleInput: () => invalid && terminal.dispose(),
        close() {
            onDispose?.();
            writeEmitter.dispose();
        },
        
    };
    const terminal = vscode.window.createTerminal({ name: "GMA", pty, color: new vscode.ThemeColor('button.background'),  });
    
    const id = await terminal.processId;
    const isShow = async () => {
        const activeId = await vscode.window.activeTerminal?.processId;
        return activeId === id;
    };

    return {
        id: id,
        show: ()=> terminal.show(),
        hide: ()=> terminal.hide(),
        isShow,
        write: (value: string) => !invalid && writeEmitter.fire(value + '\r\n'),
        activate: () => (invalid = false),

        invalidate: async () => {
            writeEmitter.fire('\r\n\r\nTerminal will be reused by tasks, press any key to close it.\r\n');
            invalid = true;
            await wait(3000);
            terminal.dispose();
            terminal.hide();
        },
    };
};

export type LoadingTask = { report: (message: string) => void; stop: () => void };

export const createLoading = async (title: string) => {
    return new Promise<LoadingTask>((resolve) => {
        const option = {
            location: vscode.ProgressLocation.Window,
            title,
            cancellable: false,
        };
        void vscode.window.withProgress(option, (progress) => new Promise<void>((stop) => {
            const report = (message: string) => progress.report({ message });
            resolve({
                report,
                stop: () => stop(),
            });
        }));
    });
};