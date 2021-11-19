import * as vscode from "vscode";
import { YamlUtils } from "../../core/YamlUtils";
import { CommandTaskDefinition,CustomBuildTaskTerminal } from ".";

export class CommandBuildTaskProvider implements vscode.TaskProvider, vscode.Disposable {
	static commandTaskType = 'gma';
	private tasks: vscode.Task[] | undefined;
	private sharedState: string | undefined;

	constructor(private workspaceFile: vscode.Uri) { }
	dispose() {
		throw new Error("Method not implemented.");
	}

	public async provideTasks(): Promise<vscode.Task[]> {
		return this.getTasks();
	}

	public resolveTask(_task: vscode.Task): vscode.Task | undefined {
		const flavor: string = _task.definition.flavor;
		if (flavor) {
			const definition: CommandTaskDefinition = <any>_task.definition;
			return this.getTask(definition.flags, definition);
		}
		return undefined;
	}

	private getTasks(): vscode.Task[] {
		if (this.tasks !== undefined) {
			return this.tasks;
		}
        const x = new YamlUtils().load();
        if (x?.runners !== undefined) {
            x?.runners?.forEach(runner => {
                this.tasks?.push(this.getTask(runner.run));
            });
        } else {
            this.tasks = [];
        }
        
        return [];
	}

	private getTask(args: string, definition?: CommandTaskDefinition): vscode.Task {
		if (definition === undefined) {
			definition = {
				type: CommandBuildTaskProvider.commandTaskType,
				args: args.split(' ')
			} as CommandTaskDefinition;
		}
		return new vscode.Task(definition, vscode.TaskScope.Workspace, `${args}`,
			CommandBuildTaskProvider.commandTaskType, new vscode.CustomExecution(async (): Promise<vscode.Pseudoterminal> => {
				return new CustomBuildTaskTerminal(this.workspaceFile.path, args.split(' '), () => this.sharedState, (state: string) => this.sharedState = state);
			}));
	}

	public static register(context: vscode.ExtensionContext, workspaceFile: vscode.Uri): CommandBuildTaskProvider {
		const provider = new CommandBuildTaskProvider(workspaceFile);
		context.subscriptions.push(vscode.tasks.registerTaskProvider(CommandBuildTaskProvider.commandTaskType, provider));
		return provider;
	}
}