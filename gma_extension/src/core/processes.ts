import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import pidtree = require('pidtree');
import { createLoading, createOutput, LoadingTask, OutputTask } from './processes_utils';
import { RunnerPickItem } from '../models/interfaces/i_runner_picker';
import { GmaAppConfiguration, IState, ProgressStatus } from '../models';

interface Processes {
    [key: string]: childProcess.ChildProcess;
}
interface ProcessData {
    name: string;
    command: string;
    args: string[];
    commandId: string;
    path: string;
}
type Outputs = {
    [key: string]: OutputTask;
};


export class Process {
    private static _instance: Process;
    public static get instance() {
        this._instance = this._instance ?? new Process();
        return this._instance;
    }

    getDirPath(uri: vscode.Uri) {
        return fs.statSync(uri.fsPath).isFile() ? vscode.Uri.joinPath(uri, '../').fsPath : uri.fsPath;
    }

    private processes: Processes = {};
    private outputs: Outputs = {};
    private get rootPath() {
        return path.dirname(vscode.workspace.workspaceFile!.fsPath);
    }
    private getArguments(value: IState): string[] {
        var appPackageName = value.app?.key ?? "";
        const shortTag = `${value.stage?.key ?? ''}${value.country?.key ?? ''}`;
        return ['flavor', appPackageName, '--change', shortTag, '--no-from-extension', '-v'];
    }
    private async processCommand(data: ProcessData, callback: (status: ProgressStatus) => void, started?:() => void)  {
    
        const command = data.command;
        const args = data.args;
        const cwd = data.commandId;
        const folder = data.path;
        this.outputs[cwd] =
            this.outputs[cwd] ??
            (await createOutput(data.name, async () => {
                delete this.outputs[cwd];
            }));
        const output = this.outputs[cwd];
        output.activate();

        let process = this.processes[cwd];
        if (process) {
            const outputIsShow = await output.isShow();
            if (!outputIsShow) {
                return output.show();
            }

            const option = await vscode.window.showWarningMessage(
                `The task '${command} :(${data.name})' is already active.`,
                'Terminate Task',
                'Restart Task'
            );

            if (option === 'Terminate Task') {
                return await this.terminate(data.commandId);
            } else if (option === 'Restart Task') {
                await this.terminate(data.commandId);
            } else {
                return;
            }
        }
        
        output.activate();
        let _loading: LoadingTask | undefined;
        const loading = async (text: string, stop = false) => {
            _loading = _loading ?? (await createLoading(data.name));
            _loading.report(text);
            if (stop) {
                _loading.stop();
                _loading = undefined;
            }
        };

        output.show();
        output.write(`command: ${cwd}`);
        output.write([command, ...args].join(' '));
        await loading([command,...args].join(' '));
        process = childProcess.spawn(command, args, { cwd: folder, shell: os.platform() === 'win32' });
        this.processes[cwd] = process;

        const getMessage = (value: any) => (value.toString() as string).split('\n').join(' ');
        started?.();
        process.stdout?.on('data', async (value) => {
            const message = getMessage(value);
            const finished = message.includes('Succeeded after') ? true : false;
            await loading(message, finished);
            output.write(message);
        });

        process.on('error', async (value) => {
            const message = getMessage(value);
            await loading(message);
            output.write(message);
            callback(ProgressStatus.failed);
            
        });

        process.stderr?.on('data', async (value) => {
            const message = getMessage(value);
            await loading(message);
            output.write(message);
        });

        process.on('exit', async (code) => {
            this.processes[cwd]?.kill();
            await loading(`exit ${code}`, true);
            output?.write(`exit ${code}`);
            output?.invalidate();
            console.log('this.processes[cwd]=' + this.processes[cwd]);
            delete this.processes[cwd];
            console.log('this.processes[cwd]=' + this.processes[cwd]);
            callback(code === 0 ? ProgressStatus.success : ProgressStatus.failed);

        });
        
    
    }

    async runChangeFlavor(data: IState, callback: (status: ProgressStatus) => void) {
        const command = 'gmat';
        const args = this.getArguments(data);
        const commandId = 'change:flavor';
        await this.processCommand({ name: commandId, command, args, commandId, path: this.rootPath }, callback);
    }

    async runCommand(data: RunnerPickItem, callback: (status: ProgressStatus) => void) {
        const command = data.run[0];
        const args = data.run.slice(1);
        const commandId = data.label;
        await this.processCommand({ name: data.label, command, args, commandId,path: this.rootPath }, callback);
    }

    async runBuildRunner(data:{
        type: 'watch' | 'build', uri: vscode.Uri
    }, callback: (status: ProgressStatus) => void) {
        const command = 'flutter';
        const args = ['pub', 'run', 'build_runner', data.type, '--delete-conflicting-outputs'];
        const commandId = `build:${path.dirname(data.uri.fsPath)}`;
        await this.processCommand({ name: 'build', command, args, commandId , path: path.dirname(data.uri.fsPath)}, callback);
    }
    async runServer(data: GmaAppConfiguration, callback: (status: ProgressStatus) => void, started?:() => void) {
        const serverBuildPath = path.join(this.rootPath, data.folder, 'build','web');
        const command = 'vschttpd';
        const args = ['-p',data.port!.toString(), '-r', serverBuildPath];
        const commandId = data.serverComandId;
        await this.processCommand({ name: commandId, command, args, commandId , path: this.rootPath}, callback, started);
        return;
    }
    isServerRunning(data: GmaAppConfiguration): boolean {
        return this.processes[data.serverComandId] !== undefined;
    }

    async terminate(commandId: string) {
        let cwd: string = commandId;
        const process = this.processes[cwd];
        if (process?.pid) {
            const isWindow = os.platform() === 'win32';
            const kill = isWindow ? 'tskill' : 'kill';
            const pids = await pidtree(process.pid);
            pids?.forEach((cpid) => {
                childProcess.exec(`${kill} ${cpid}`);
            });
        }
        await new Promise<void>((resolve) => {
            const numid = setInterval(() => {
                if (!this.processes[cwd]) {
                    clearInterval(numid);
                    resolve();
                }
            }, 100);
        });
    }
}