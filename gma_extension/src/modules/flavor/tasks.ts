import * as vscode from 'vscode';
import { IState } from '../../models/interfaces/IState';
import { IMessageEvent } from '../../models/interfaces/IMessageEvent';
import { ProgressStatus } from '../../models/dto/ProgressState';
import { cachedDataVersionTag } from 'v8';
export class ChangeFlavorTask {
    private rootWorkspaceFolder: vscode.WorkspaceFolder | undefined;
    private _onDidChanged: vscode.EventEmitter<IMessageEvent>;

    constructor(workspaceFolder: vscode.WorkspaceFolder | undefined) {
        this.rootWorkspaceFolder = workspaceFolder;
        this._onDidChanged = new vscode.EventEmitter<IMessageEvent>();
    }
    get onDidChanged(): vscode.Event<IMessageEvent> {
        return this._onDidChanged.event;
    }

    private inProgress: boolean = false;

    public async changeFlavor(value: IState) {
        var appPackageName = value.app?.key ?? "";
        const shortTag = `${value.stage?.key ?? ''}${value.country?.key ?? ''}`;

        let task = new vscode.Task(
            { type: 'gma.flavor', name: 'change_flavor'},
            this.rootWorkspaceFolder!,
            "flavor_update",
            "gmat",
            new vscode.ShellExecution(
                "gmat",
                ['flavor', appPackageName, '--change', shortTag, '--from-extension', '-v'],
                // { cwd: this.rootWorkspaceFolder?.uri.fsPath },
            ),
            "$dart-build_runner",

        );
        task.presentationOptions = {
            reveal: vscode.TaskRevealKind.Always,
            clear: true,
            showReuseMessage: true,
            panel: vscode.TaskPanelKind.Shared,
            echo: false,
        } as vscode.TaskPresentationOptions;
        task.isBackground = true;
        task.group = vscode.TaskGroup.Build;


        vscode.tasks.executeTask(task).then((value) => {
            console.log(`executeTask success: %s`, value);
        }, (reason) => {
            console.log(`executeTask fauked: %s`, reason);
        });
        vscode.tasks.onDidStartTask((data) => {
            if (this.inProgress === true) { return; }
            this.inProgress = true;
            this.message({ message: "Change flavor started.", status: ProgressStatus.loading, value: value });
        });
        vscode.tasks.onDidStartTaskProcess((data) => {
            if (this.inProgress === true) { return; }
            this.inProgress = true;
            this.message({ message: "Change flavor started.", status: ProgressStatus.loading, value: value });
        });
        vscode.tasks.onDidEndTaskProcess((data) => {
            this.inProgress = false;
            const _data = data;
            if (data.exitCode === 0) {
                this.message({ message: "Change flavor failed.", status: ProgressStatus.success, value: value});
            } else {
                
                this.message({ message: "Change flavor finished.", status: ProgressStatus.failed, value: value, error: data.execution  });
            }
        });
    }


    private message(val: {
        status: ProgressStatus,
        message?: string | undefined,
        value?: IState | undefined,
        error?: Error | unknown,
    }
    ) {
        let _message = {
            message: val.message,
            failed: val.error,
            status: val.status,
            value: val.value
        } as IMessageEvent;
        this._onDidChanged.fire(_message);
    }
}