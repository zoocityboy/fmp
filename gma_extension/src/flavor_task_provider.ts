import path = require("path");
import * as vscode from 'vscode';
import { CancellationToken, CustomExecution, Event, EventEmitter, FileSystemWatcher, ProviderResult, Pseudoterminal, Task, TaskDefinition, TaskProvider, TaskScope, TerminalDimensions, workspace } from "vscode";
let configuration: vscode.WorkspaceConfiguration;
interface FlavorBuildTaskDedfinition extends TaskDefinition {

    flavor: string;
    flags?: string[];

}
export class FlavorTaskProvider implements TaskProvider {
    static flavorTaskType = 'kt.flavor';
    private tasks: Task[] | undefined;
    private sharedState: string | undefined;

    constructor(private workspaceRoot: string) { }

    provideTasks(token: CancellationToken): ProviderResult<Task[]> {
        return this.getTasks();
    }
    resolveTask(_task: Task, token: CancellationToken): ProviderResult<Task> {
        // const flavor: string = _task.definition.flavor;
        // if (flavor) {
        //     const definition: FlavorBuildTaskDedfinition = <any>_task.definition;
        //     return this.getTask(definition.flavor, definition.flags ? definition.flags : [], definition);
        // }
        // return undefined;
        return undefined;
    }
    private getUpdateTask() {

        // let tasks = configuration.get('tasks', {});
        // let app = getSelected(apps);
        // let flavor = getFlavorTag();
        // const workspaceRoot = getApplicationWorkspaceFolder();
        // if (!workspaceRoot || !app || !flavor) {
        //     return;
        // }
        // let command = `dart tools/koyal.dart f ${flavor} ${app.key}`;
        // let task = new vscode.Task({ type: 'kt.flavor' }, vscode.TaskScope.Workspace, "flavor:update", "dart", new vscode.ShellExecution("dart", ["tools/koyal.dart",
        //     "f",
        //     flavor,
        //     app.key]), "$dart-build_runner");




    }

    private getTasks(): Task[] {
        if (this.tasks !== undefined) {
            return this.tasks;
        }
        const flavors: string[] = ['in', 'ph', 'vn', 'id'];
        const flags: string[][] = [['watch', 'incremental'], ['incremental'], []];
        this.tasks = [];
        flavors.forEach(flavor => {
            flags.forEach(flagGroup => {
                this.tasks!.push(this.getTask(flavor, flagGroup));
            });
        });

        return this.tasks;
    }

    private getTask(flavor: string, flags: string[], definition?: FlavorBuildTaskDedfinition): Task {
        if (definition === undefined) {
            definition = {
                type: FlavorTaskProvider.flavorTaskType,
                flavor,
                flags
            };
        }
        return new Task(definition, TaskScope.Workspace, `${flavor} ${flags.join(' ')}`,
            FlavorTaskProvider.flavorTaskType, new CustomExecution(async (): Promise<Pseudoterminal> => {
                return new FlavorUpdateTaskTerminal(this.workspaceRoot, flavor, flags, () => this.sharedState, (state: string) => this.sharedState = state);
            }));
    }
}
class FlavorUpdateTaskTerminal implements Pseudoterminal {
    private writeEmitter = new EventEmitter<string>();
    onDidWrite: Event<string> = this.writeEmitter.event;
    private closeEmitter = new EventEmitter<number>();
    onDidClose?: Event<number> = this.closeEmitter.event;

    private fileWatcher: FileSystemWatcher | undefined;

    constructor(private workspaceRoot: string, private flavor: string, private flags: string[], private getSharedState: () => string | undefined, private setSharedState: (state: string) => void) {
    }

    open(initialDimensions: TerminalDimensions | undefined): void {
        // At this point we can start using the terminal.
        if (this.flags.indexOf('watch') > -1) {
            const pattern = path.join(this.workspaceRoot, 'customBuildFile');
            this.fileWatcher = workspace.createFileSystemWatcher(pattern);
            this.fileWatcher.onDidChange(() => this.doBuild());
            this.fileWatcher.onDidCreate(() => this.doBuild());
            this.fileWatcher.onDidDelete(() => this.doBuild());
        }
        this.doBuild();
    }

    close(): void {
        // The terminal has been closed. Shutdown the build.
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }

    private async doBuild(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.writeEmitter.fire('Starting build...\r\n');
            let isIncremental = this.flags.indexOf('incremental') > -1;
            if (isIncremental) {
                if (this.getSharedState()) {
                    this.writeEmitter.fire('Using last build results: ' + this.getSharedState() + '\r\n');
                } else {
                    isIncremental = false;
                    this.writeEmitter.fire('No result from last build. Doing full build.\r\n');
                }
            }

            // Since we don't actually build anything in this example set a timeout instead.
            setTimeout(() => {
                const date = new Date();
                this.setSharedState(date.toTimeString() + ' ' + date.toDateString());
                this.writeEmitter.fire('Build complete.\r\n\r\n');
                if (this.flags.indexOf('watch') === -1) {
                    this.closeEmitter.fire(0);
                    resolve();
                }
            }, isIncremental ? 1000 : 4000);
        });
    }
}
