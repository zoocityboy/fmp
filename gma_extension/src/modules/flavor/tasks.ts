import * as vscode from 'vscode';
import * as os from 'os';
import { TaskScope } from 'vscode';
import { IMessageEvent, IState, ProgressStatus } from '../../models';
import pidtree = require('pidtree');
export class ChangeFlavorTask {
    private rootFolder: vscode.Uri | undefined;
    private _onDidChanged: vscode.EventEmitter<IMessageEvent>;
    private readonly tasks: vscode.TaskExecution[] = [];

    constructor(rootFolder: vscode.Uri | undefined) {
        this.rootFolder = rootFolder;
        this._onDidChanged = new vscode.EventEmitter<IMessageEvent>();
    }
    get onDidChanged(): vscode.Event<IMessageEvent> {
        return this._onDidChanged.event;
    }

    private inProgress: boolean = false;
    private getArguments(value: IState): string[] {
        var appPackageName = value.app?.key ?? "";
        const shortTag = `${value.stage?.key ?? ''}${value.country?.key ?? ''}`;
        return ['flavor', appPackageName, '--change', shortTag, '--from-extension', '-v'];
    }

    private prepareTask(value: IState): vscode.Task {
        const args = this.getArguments(value);
        const task = new vscode.Task(
            { type: 'gma.build', name: 'Builder'},
            TaskScope.Workspace,
            "Builder",
            "gmat",
            os.platform() === 'win32' ?
            new vscode.ProcessExecution(
                "gmat",
                args,
                { cwd: this.rootFolder?.path },
            ) :
            new vscode.ShellExecution(
                "gmat",
                args,
                { cwd: this.rootFolder?.path },
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
        return task;
    }

    public async run(value: IState) {
        const task = this.prepareTask(value);
        vscode.tasks.onDidStartTask((data) => {
            data.execution;
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
                this.message({ message: "Change flavor success.", status: ProgressStatus.success, value: value});
            } else {
                
                this.message({ message: "Change flavor failed.", status: ProgressStatus.failed, value: value, error: data.execution  });
            }
        });
        const execution = await vscode.tasks.executeTask(task);
        this.tasks.push(execution);
    }
    public dispose() {
        if (this.tasks.length > 0) { return; }
        this.tasks.forEach((task) => {
            task.terminate();
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