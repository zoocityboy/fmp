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

export class ProcessesHandler{
    public onDidChanged: vscode.EventEmitter<ProgressStatus> = new vscode.EventEmitter<ProgressStatus>();

}

export class Process {
    private static _instance: Process;
    public static get instance() {
        this._instance = this._instance ?? new Process();
        return this._instance;
    }
    private _onDidChanged: vscode.EventEmitter<ProgressStatus> = new vscode.EventEmitter<ProgressStatus>();

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
        return ['flavor', appPackageName, '--change', shortTag, '--from-extension', '-v'];
    }

    private processCommand = async  (data: ProcessData, cb?: (data: ProgressStatus) => void) => {
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

            await loading([command, ...args].join(' '));
            process = childProcess.spawn(command, args, { cwd: folder, shell: os.platform() === 'win32', stdio: 'pipe', detached: true, windowsVerbatimArguments: true });
            this.processes[cwd] = process;

            const getMessage = (value: any) => (value.toString() as string).split('\n').join(' ');
            
            process.stdout?.on('data', async (value) => {
                const message = getMessage(value);
                const finished = message.includes('Succeeded after') ? true : false;
                await loading(message, finished);
                output.write(message);
                console.log(message);
                console.log(`stdout:on:data ${message}`);
                cb?.(ProgressStatus.loading);
            });

            process.stderr?.on('data', async (value) => {
                const message = getMessage(value);
                await loading(message);
                output.write(message);
                console.log(`stderr:on:data ${message}`);
            });
            process.on('spawn', async () => {
                await loading('Spawned');
                output.write('Spawned');
                console.log('Spawned');
                console.log(`on:spawn Spawned`);
                cb?.(ProgressStatus.loading);
            });
            process.on('close', async (code) => {
                console.log(`on:close ${code}`);
            });
            process.on('error', async (value) => {
                const message = getMessage(value);
                await loading(message);
                output.write(message);
                console.log(`on:error ${message}`);
                cb?.(ProgressStatus.failed);

            });
            process.on('exit', async (code) => {
                this.processes[cwd]?.kill();
                await loading(`exit ${code}`, true);
                output?.write(`exit ${code}`);
                output?.invalidate();
                console.log(`on:exit ${code}`);

                console.log('this.processes[cwd]=' + this.processes[cwd]);
                delete this.processes[cwd];
                cb?.(code === 0 ? ProgressStatus.success : ProgressStatus.failed);
            });
        };

    public runChangeFlavor = (data: IState ) => 
        new Promise((resolve, reject) =>{
            const command = 'gmat';
            const args = this.getArguments(data);
            const commandId = 'change:flavor';
            this.processCommand({ name: commandId, command, args, commandId, path: this.rootPath }, (value)=>{
                switch (value) {
                    case ProgressStatus.success:
                        resolve(value);
                    case ProgressStatus.failed:
                        reject(value);  
                }
            });
    });
    

    public runCommand = (data: RunnerPickItem) => 
    new Promise((resolve, reject) =>{
        const command = data.run[0];
        const args = data.run.slice(1);
        const commandId = data.label;
        this.processCommand({ name: data.label, command, args, commandId, path: this.rootPath }, (value)=>{
            switch (value) {
                case ProgressStatus.success:
                    resolve(value);
                case ProgressStatus.failed:
                    reject(value);  
            }
        });
    });

    runBuildRunner = (data: {
        type: 'watch' | 'build', uri: vscode.Uri
    }) => 
    new Promise((resolve, reject) =>{
        const command = 'flutter';
        const args = ['pub', 'run', 'build_runner', data.type, '--delete-conflicting-outputs'];
        const commandId = `build:${path.dirname(data.uri.fsPath)}`;
        this.processCommand({ name: 'build', command, args, commandId, path: path.dirname(data.uri.fsPath) }, (value)=>{
            switch (value) {
                case ProgressStatus.success:
                    resolve(value);
                case ProgressStatus.failed:
                    reject(value);  
            }
        });
    });
    runServer = (data: GmaAppConfiguration) => 
        new Promise((resolve, reject) => {
            const serverBuildPath = path.join(this.rootPath, data.folder, 'build', 'web');
            const command = 'vschttpd';
            const args = ['-p', data.port!.toString(), '-r', serverBuildPath];
            const commandId = data.serverComandId;
            this.processCommand({ name: commandId, command, args, commandId, path: this.rootPath }, (value)=>{
                console.log(`default: ${ProgressStatus.default} loading: ${ProgressStatus.loading} failed: ${ProgressStatus.failed}  success: ${ProgressStatus.success}`);
                console.log(`server ${commandId} value: ${value}`);
                switch (value) {
                    case ProgressStatus.loading:
                        resolve(value);
                    case ProgressStatus.success:
                        resolve(value);
                    case ProgressStatus.failed:
                        reject(value);  
                }
            });
        
    });
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