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
    private inProgress: boolean = false;
    public changeFlavor(flavor: string, app: string, force: boolean = false) {
        var appPackageName = app === 'capp' ? 'self_care' : 'mapp';
        let task = new vscode.Task(
            { type: 'gma.flavor', name: 'change_flavor' },
            vscode.TaskScope.Workspace,
            "flavor_update",
            "gmat",
            new vscode.ShellExecution(
                "gmat",
                ['flavor', appPackageName, '--change', flavor,],
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

        // this.message('Preparing flavor...');
        vscode.tasks.executeTask(task).then((value) => {
            console.log(`executeTask: %s`, value);
        });
        // vscode.tasks.onDidStartTask((value) => {
        //     this.message("Change flavor started.");
        // });
        // vscode.tasks.onDidEndTask((value) => {
        //     this.message("Change flavor finished.");
        // });
        vscode.tasks.onDidStartTaskProcess((value) => {
            if (this.inProgress === true) { return; }
            this.inProgress = true;
            console.log('onDidStartTaskProcess: %s : %s : %s', value.processId, value.execution.task.definition.type, value.execution.task.definition.name);
            this.message("Change flavor started.", undefined, ProgressState.loading);
        });
        vscode.tasks.onDidEndTaskProcess((value) => {

            console.log('onDidEndTaskProcess: %s : %s', value.execution.task.definition.type, value.execution.task.definition.name);
            this.message("Change flavor finished.", undefined, ProgressState.complete);
            this.inProgress = false;
        });
    }
    private restartAnalyzer() {

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