import * as vscode from 'vscode';

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
    const terminal = vscode.window.createTerminal({ name: "GMAT", pty, color: new vscode.ThemeColor('button.background'),  });
    
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
        write: (value: string) => !invalid && writeEmitter.fire(value + '\r'),
        activate: () => (invalid = false),

        invalidate: () => {
            writeEmitter.fire('\r\n\r\nTerminal will be reused by tasks, press any key to close it.\r\n');
            invalid = true;
        },
    };
};