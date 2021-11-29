/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { createOutput, OutputTask } from './processes_utils';
import { RunnerPickItem } from '../models/interfaces/i_runner_picker';
import { Constants, GmaAppConfiguration, IState, ProgressStatus } from '../models';
import { SpawnOptionsWithoutStdio } from 'child_process';
import { wait } from '../extension';
import { UiProgress } from './progress';
import { IAvailableExtension } from './update';
import { ServerStatusEvent } from '../modules/servers/server_runner';

interface Processes {
    [key: string]: childProcess.ChildProcess;
}
interface ProcessData {
    name: string;
    command: string;
    args: string[];
    commandId: string;
    path: string;
    location?: vscode.ProgressLocation
}
type Outputs = {
    [key: string]: OutputTask;
};

export class ProcessesHandler{
    public onDidChanged: vscode.EventEmitter<ProgressStatus> = new vscode.EventEmitter<ProgressStatus>();

}

export class Process {
    private static _instance: Process;
    public static get I() {
        this._instance = this._instance ?? new Process();
        return this._instance;
    }
    private pidtree = require('pidtree');

    getDirPath(uri: vscode.Uri) {
        return fs.statSync(uri.fsPath).isFile() ? vscode.Uri.joinPath(uri, '../').fsPath : uri.fsPath;
    }

    private processes: Processes = {};
    private outputs: Outputs = {};
    private get rootPath(): string | undefined {
        if (vscode.workspace.workspaceFile !== undefined) {
            return path.dirname(vscode.workspace.workspaceFile.fsPath);
        } else {
            return undefined;
        }
        
    }
    private getArguments(value: IState): string[] {
        const appPackageName = value.app?.key ?? "";
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
                // eslint-disable-next-line @typescript-eslint/require-await
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
                    'Terminate',
                    'Restart'
                );

                if (option === 'Terminate') {
                    return await this.terminate(data.commandId);
                } else if (option === 'Restart') {
                    await this.terminate(data.commandId);
                } else {
                    return;
                }

            }

            output.activate();
            if (data.location !== vscode.ProgressLocation.Notification) {
                output.show();
            }
            
            const writeMessage = (value: string) => {
                output.write(value);
            }
            const writeLoadingMessage = async (value: any, exit?: boolean) => {
                const text = String(value);
                const finished = exit === undefined ? text.includes('SUCCESS') || text.includes('FAILED') ? true : false : exit;
                const texts = text.split('\n') ?? [text];
                for (const message of texts){
                    /// remove time from message
                    const position = message.indexOf(']') +1;
                    const _message = position > -1 ? message.substring(position) : message;
                    /// remove special characters from output
                    const fixed = _message.replace('⌙', '')
                    .replace('⌾', '')
                    .replace('⌘', '')
                    .replace('⌞', '')
                    .replace('○', '')
                    .replace(']','').trim();
                    if (fixed.length > 0) {
                        await wait(100);
                            if (finished) {
                                await UiProgress.instance.hideAfterDelay(data.commandId, fixed, data.location);
                            } else {
                                await UiProgress.instance.progress(data.commandId, fixed, finished, data.location);
                            }
                        
                    }
                }
            };

            await writeLoadingMessage([command, ...args].join(' '));
            process = childProcess.spawn(command, args, { 
                cwd: folder, 
                shell: os.platform() === 'win32', 
                stdio: 'pipe', 
                detached: false, 
                windowsVerbatimArguments: false 
            } as SpawnOptionsWithoutStdio);
            this.processes[cwd] = process;
            cb?.(ProgressStatus.loading);
            process.stdout?.on('data', async (value) => {
                writeMessage(value);
                await writeLoadingMessage(value);
            });

            process.stderr?.on('data', async (value) => {
                writeMessage(value);
                await writeLoadingMessage(value);
            });

            process.on('spawn', async () => {
                const value = 'Running command ...';
                writeMessage(value);                
                cb?.(ProgressStatus.loading);
                await writeLoadingMessage(value);
                
            });
            process.on('error', async (value) => {
                if (value instanceof Error) {
                    writeMessage(value?.message);
                } else if (typeof value === 'string') {
                    writeMessage(value);
                } else {
                    writeMessage(`${value}`);
                }
                
                cb?.(ProgressStatus.failed);
                output?.show();
                await writeLoadingMessage(value);
            });
            process.on('exit', async (code) => {
                this.processes[cwd]?.kill();
                const status = code === 0 ? 'Successfully finished' : 'Failed';
                
                writeMessage(status);
                // output?.invalidate();

                delete this.processes[cwd];
                const exitCode = code ?? 0;
                // exitCode 143 - killed by user
                [0,143].includes(exitCode) ? cb?.(ProgressStatus.success) : cb?.(ProgressStatus.failed);
                
                if (![0,143].includes(exitCode)){
                    output.show();
                }
                await writeLoadingMessage(status, true);
                
            });
        };

    public runChangeFlavor = (data: IState ) => {
        return new Promise((resolve, reject) => {
            const command = 'gmat';
            const args = this.getArguments(data);
            const commandId = 'change:flavor';
            void this.processCommand({ name: commandId, command, args, commandId, path: this.rootPath ?? '' }, (value)=>{
                switch (value) {
                    case ProgressStatus.success:
                        resolve(value);
                        break;
                    case ProgressStatus.failed:
                        reject(value);
                        break;  
                }
            });
        });
    } 
    
    public runCommand = (data: RunnerPickItem) => {
    return new Promise((resolve, reject) => {
        const command = data.run[0];
        const args = data.run.slice(1);
        const commandId = data.label;
        // data.location = vscode.ProgressLocation.Window;
        void this.processCommand({ name: data.label, command, args, commandId, path: this.rootPath ?? '',  location: vscode.ProgressLocation.Window } as ProcessData, (value)=>{
            switch (value) {
                case ProgressStatus.success:
                    resolve(value);
                    break;
                case ProgressStatus.failed:
                    reject(value);
                    break;  
            }
        });
    });}

    runBuildRunner = (data: {
        type: 'watch' | 'build', uri: vscode.Uri
    }) =>{ 
    return new Promise((resolve, reject) => {
        const command = 'flutter';
        const args = ['pub', 'run', 'build_runner', data.type, '--delete-conflicting-outputs'];
        const commandId = `build:${path.dirname(data.uri.fsPath)}`;
        void this.processCommand({ name: 'build', command, args, commandId, path: path.dirname(data.uri.fsPath) }, (value)=>{
            switch (value) {
                case ProgressStatus.success:
                    resolve(value);
                    break;
                case ProgressStatus.failed:
                    reject(value);
                    break;  
            }
        });
    });}
    runServer = (data: GmaAppConfiguration, results: vscode.EventEmitter<ServerStatusEvent> ) => {
        const serverBuildPath = path.join(this.rootPath ??'', data.folder, 'build', 'web');
        const command = Constants.gmaServerName;
        const args = ['-p', data.port?.toString() ?? '', '-r', serverBuildPath];
        const commandId = data.serverComandId;
        void this.processCommand({ name: commandId, command, args, commandId, path: this.rootPath ?? '', location: vscode.ProgressLocation.Window },(value) => {
            console.log(value);
            results.fire({
                status: value,
                item: data
            } as ServerStatusEvent);
        });
    }

    isServerRunning(data: GmaAppConfiguration): boolean {
        return this.isProcessRunning(data.serverComandId);
    }
    isProcessRunning(commandId: string): boolean {
        return this.processes[commandId] !== undefined;
    }

    runUpdate = (data: IAvailableExtension) => {
        return new Promise((resolve, reject) => {
            const command = 'code';
            const args = ['--install-extension',data.name, '--force'];
            const commandId = `update:studio`;
            void this.processCommand({ name: 'build', command, args, commandId, path: path.dirname(data.uri.fsPath), location: vscode.ProgressLocation.Window }, (value)=>{
                switch (value) {
                    case ProgressStatus.success:
                        resolve(value);
                        break;
                    case ProgressStatus.failed:
                        reject(value);
                        break;  
                }
            });
        });
    }

    async terminate(commandId: string) {
        const cwd: string = commandId;
        const process = this.processes[cwd];
        if (process?.pid) {
            const isWindow = os.platform() === 'win32';
            const kill = isWindow ? 'tskill' : 'kill';
            const pids = await this.pidtree(process.pid);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            pids?.forEach((cpid:number) => {
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