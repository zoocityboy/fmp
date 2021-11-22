import * as vscode from "vscode";
import * as os from 'os';
import { YamlUtils } from "../../core/yaml_utils";
import { CommandTaskDefinition,CustomBuildTaskTerminal } from ".";
import { GmaConfigurationRunner } from "../../models";

export enum PlatformPrefix{
	unix, win
}
export class CommandBuildTaskProvider implements vscode.TaskProvider, vscode.Disposable {
	static commandTaskType = 'gma';
	private tasks: vscode.Task[] | undefined;
	private sharedState: string | undefined;
	private isWin = os.platform() === 'win32';
	constructor(private workspaceFile: vscode.Uri) { }
	dispose() {
		throw new Error("Method not implemented.");
	}

	public async provideTasks(): Promise<vscode.Task[]> {
		return this.getTasks();
	}

	public resolveTask(_task: vscode.Task): vscode.Task | undefined {
		const runner: string = _task.definition.runner;
		if (runner) {
			const definition: CommandTaskDefinition = <any>_task.definition;
			return this.getTask(definition.flags, definition);
		}
		return undefined;
	}

	private getTasks(): vscode.Task[] {
		if (this.tasks !== undefined) {
			return this.tasks;
		}
        const config = new YamlUtils().load();
        config?.platformSupportedRunners?.forEach(runner => this.tasks?.push(this.getTask(runner)));
        
        return [];
	}

	private getTask(runner: GmaConfigurationRunner, definition?: CommandTaskDefinition): vscode.Task {
		if (definition === undefined) {
			definition = {
				type: CommandBuildTaskProvider.commandTaskType,
				name: runner.name,
				description: runner.description,
				run: runner.run.split(' '),
			} as CommandTaskDefinition;
		}
		return new vscode.Task(definition, vscode.TaskScope.Workspace, runner.name,
			CommandBuildTaskProvider.commandTaskType, new vscode.CustomExecution(async (): Promise<vscode.Pseudoterminal> => {
				return new CustomBuildTaskTerminal(this.workspaceFile.path, runner.run.split(' '), () => this.sharedState, (state: string) => this.sharedState = state);
			}));
	}

	public static register(context: vscode.ExtensionContext, workspaceFile: vscode.Uri): CommandBuildTaskProvider {
		const provider = new CommandBuildTaskProvider(workspaceFile);
		context.subscriptions.push(vscode.tasks.registerTaskProvider(CommandBuildTaskProvider.commandTaskType, provider));
		return provider;
	}
}