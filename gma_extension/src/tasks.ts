import * as vscode from 'vscode';
import { ProgressState, TaskChangeEvent } from './models';
export class FlavorTasks {
    public rootWorkspaceFolder: vscode.WorkspaceFolder | undefined;
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
        console.log(this.rootWorkspaceFolder);
        console.log(vscode.TaskScope.Global);
        let task = new vscode.Task(
            { type: 'gma.flavor', name: 'change_flavor' },
            this.rootWorkspaceFolder!,
            "flavor_update",
            "gmat",
            new vscode.ShellExecution(
                "gmat",
                ['flavor', appPackageName, '--change', flavor,'--from-extension', '-v'],
            ),
            "$dart-build_runner",

        );
        task.presentationOptions = {
            reveal: vscode.TaskRevealKind.Silent,
            clear: true,
            showReuseMessage: false,
            panel: vscode.TaskPanelKind.New,
            echo: false,
        } as vscode.TaskPresentationOptions;
        task.isBackground = true;


        vscode.tasks.executeTask(task).then((value) => {
            console.log(`executeTask success: %s`, value);
        }, (reason) => {
            console.log(`executeTask fauked: %s`, reason);
        });
       
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