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
    public changeFlavor(flavor: string, app: string, force: boolean = false) {
        let task = new vscode.Task(
            { type: 'gma.flavor', name: 'change_flavor' },
            vscode.TaskScope.Workspace,
            "flavor_update",
            "dart ",
            new vscode.ProcessExecution(
                "dart",
                ['/Users/zoocityboy/Develop/fmp/gma_tooling/bin/gmat.dart', 'flavor', '--flavor', flavor, '-app', app],
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
            console.log('onDidStartTaskProcess: %s : %s : %s', value.processId, value.execution.task.definition.type, value.execution.task.definition.name);
            this.message("Change flavor started.", undefined, ProgressState.loading);
        });
        vscode.tasks.onDidEndTaskProcess((value) => {
            console.log('onDidEndTaskProcess: %s : %s', value.execution.task.definition.type, value.execution.task.definition.name);
            this.message("Change flavor finished.", undefined, ProgressState.complete);

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