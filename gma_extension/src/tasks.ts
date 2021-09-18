import * as vscode from 'vscode';
import { ProgressState, TaskChangeEvent } from './models';
export class FlavorTasks {
    private _onDidChanged: vscode.EventEmitter<TaskChangeEvent>;
    constructor() {
        this._onDidChanged = new vscode.EventEmitter<TaskChangeEvent>();
    }
    get onDidChanged(): vscode.Event<TaskChangeEvent> {
        return this._onDidChanged.event;
    }
    public changeFlavor(flavor: string, force: boolean = false) {
        let task = new vscode.Task(
            { type: 'gma.flavor' },
            vscode.TaskScope.Workspace,
            "flavor_update",
            "dart",
            // new vscode.ShellExecution(
            //     "koyal_flavor",
            //     ["-f", flavor,]
            // ),
            new vscode.ProcessExecution(
                "koyal_flavor",
                ["-f", flavor, '-r']
            ),
            "$dart-build_runner",

        );
        task.presentationOptions = {
            reveal: vscode.TaskRevealKind.Silent,
            clear: true,
            showReuseMessage: false,
            panel: vscode.TaskPanelKind.Dedicated,
            echo: false,
        } as vscode.TaskPresentationOptions;
        task.isBackground = true;

        this.message('Preparing flavor...');
        vscode.tasks.executeTask(task);
        // vscode.tasks.onDidStartTask((value) => {
        //     this.message("Change flavor started.");
        // });
        // vscode.tasks.onDidEndTask((value) => {
        //     this.message("Change flavor finished.");
        // });
        vscode.tasks.onDidStartTaskProcess((value) => {
            this.message("Change flavor started.", undefined, ProgressState.loading);
        });
        vscode.tasks.onDidEndTaskProcess((value) => {

            console.log('finished: %s : %s', value.exitCode, value.execution);
            this.message("Change flavor finished.", undefined, ProgressState.complete);
        });
    }
    private message(
        message?: string | undefined,
        error: Error | unknown | undefined = undefined,
        state: ProgressState = ProgressState.default,
    ) {
        let _message = {
            message: message,
            failed: error,
            state: state,
        } as TaskChangeEvent;
        this._onDidChanged.fire(_message);
    }
}