import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as rimraf from 'rimraf';
import { Constants } from '../../models/constants';

//#region Utilities

namespace _ {

	function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
		if (error) {
			reject(massageError(error));
		} else {
			resolve(result);
		}
	}

	function massageError(error: Error & { code?: string }): Error {
		if (error.code === 'ENOENT') {
			return vscode.FileSystemError.FileNotFound();
		}

		if (error.code === 'EISDIR') {
			return vscode.FileSystemError.FileIsADirectory();
		}

		if (error.code === 'EEXIST') {
			return vscode.FileSystemError.FileExists();
		}

		if (error.code === 'EPERM' || error.code === 'EACCESS') {
			return vscode.FileSystemError.NoPermissions();
		}

		return error;
	}

	export function checkCancellation(token: vscode.CancellationToken): void {
		if (token.isCancellationRequested) {
			throw new Error('Operation cancelled');
		}
	}

	export function normalizeNFC(items: string): string;
	export function normalizeNFC(items: string[]): string[];
	export function normalizeNFC(items: string | string[]): string | string[] {
		if (process.platform !== 'darwin') {
			return items;
		}

		if (Array.isArray(items)) {
			return items.map(item => item.normalize('NFC'));
		}

		return items.normalize('NFC');
	}

	export function readdir(path: string): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			fs.readdir(path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
		});
	}

	export function stat(path: string): Promise<fs.Stats> {
		return new Promise<fs.Stats>((resolve, reject) => {
			fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
		});
	}

	export function readfile(path: string): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			fs.readFile(path, (error, buffer) => handleResult(resolve, reject, error, buffer));
		});
	}

	export function writefile(path: string, content: Buffer): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fs.writeFile(path, content, error => handleResult(resolve, reject, error, void 0));
		});
	}

	export function exists(path: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			fs.exists(path, exists => handleResult(resolve, reject, null, exists));
		});
	}

	export function rmrf(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			rimraf(path, error => handleResult(resolve, reject, error, void 0));
		});
	}

	export function mkdir(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const res = mkdirp(path);
			// handleResult(resolve, reject, error, void 0)
		});
	}

	export function rename(oldPath: string, newPath: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fs.rename(oldPath, newPath, error => handleResult(resolve, reject, error, void 0));
		});
	}

	export function unlink(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fs.unlink(path, error => handleResult(resolve, reject, error, void 0));
		});
	}
}

export class FileStat implements vscode.FileStat {

	constructor(private fsStat: fs.Stats) { }

	get type(): vscode.FileType {
		return this.fsStat.isFile() ? vscode.FileType.File : this.fsStat.isDirectory() ? vscode.FileType.Directory : this.fsStat.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown;
	}

	get isFile(): boolean | undefined {
		return this.fsStat.isFile();
	}

	get isDirectory(): boolean | undefined {
		return this.fsStat.isDirectory();
	}

	get isSymbolicLink(): boolean | undefined {
		return this.fsStat.isSymbolicLink();
	}

	get size(): number {
		return this.fsStat.size;
	}

	get ctime(): number {
		return this.fsStat.ctime.getTime();
	}

	get mtime(): number {
		return this.fsStat.mtime.getTime();
	}
}

interface Entry {
	uri: vscode.Uri;
	type: vscode.FileType;
}

//#endregion

export class FileSystemProvider implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider {
	private subfolder?: string | undefined;

	private _onDidChangeFile: vscode.EventEmitter<vscode.FileChangeEvent[]>;
	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | null | void> = new vscode.EventEmitter<Entry | undefined | null | void>();
  	readonly onDidChangeTreeData: vscode.Event<Entry | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor(subfolder?: string | undefined) {
		this.subfolder = subfolder;
		this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	}

	get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
		return this._onDidChangeFile.event;
	}

	watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
		const watcher = fs.watch(uri.fsPath, { recursive: options.recursive }, async (event: string, filename: string | Buffer) => {
			const filepath = path.join(uri.fsPath, _.normalizeNFC(filename.toString()));
			this._onDidChangeFile.fire([{
				type: event === 'change' ? vscode.FileChangeType.Changed : await _.exists(filepath) ? vscode.FileChangeType.Created : vscode.FileChangeType.Deleted,
				uri: uri.with({ path: filepath })
			} as vscode.FileChangeEvent]);
		});

		return { dispose: () => watcher.close() };
	}

	stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
		return this._stat(uri.fsPath);
	}

	async _stat(path: string): Promise<vscode.FileStat> {
		return new FileStat(await _.stat(path));
	}

	readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
		return this._readDirectory(uri);
	}

	async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
		const children = await _.readdir(uri.fsPath);

		const result: [string, vscode.FileType][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const stat = await this._stat(path.join(uri.fsPath, child));
			result.push([child, stat.type]);
		}

		return Promise.resolve(result);
	}

	createDirectory(uri: vscode.Uri): void | Thenable<void> {
		return _.mkdir(uri.fsPath);
	}

	readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
		return _.readfile(uri.fsPath);
	}

	writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
		return this._writeFile(uri, content, options);
	}

	async _writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
		const exists = await _.exists(uri.fsPath);
		if (!exists) {
			if (!options.create) {
				throw vscode.FileSystemError.FileNotFound();
			}

			await _.mkdir(path.dirname(uri.fsPath));
		} else {
			if (!options.overwrite) {
				throw vscode.FileSystemError.FileExists();
			}
		}

		return _.writefile(uri.fsPath, content as Buffer);
	}

	delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
		if (options.recursive) {
			return _.rmrf(uri.fsPath);
		}

		return _.unlink(uri.fsPath);
	}

	rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
		return this._rename(oldUri, newUri, options);
	}

	async _rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
		const exists = await _.exists(newUri.fsPath);
		if (exists) {
			if (!options.overwrite) {
				throw vscode.FileSystemError.FileExists();
			} else {
				await _.rmrf(newUri.fsPath);
			}
		}

		const parentExists = await _.exists(path.dirname(newUri.fsPath));
		if (!parentExists) {
			await _.mkdir(path.dirname(newUri.fsPath));
		}

		return _.rename(oldUri.fsPath, newUri.fsPath);
	}

	getFileFolder(uri: vscode.Uri): vscode.Uri {
		const stats = fs.statSync(uri.fsPath);
		if (stats.isDirectory()) {
			return uri;
		} else if (stats.isFile()) {
			const dirname = path.dirname(uri.fsPath);
			return vscode.Uri.parse(dirname);
		}
		return uri;
	}

	// tree data provider

	async getChildren(element?: Entry): Promise<Entry[]> {
		if (element) {
			const children = await this.readDirectory(element.uri);
			return children.map(([name, type]) => ({ uri: vscode.Uri.file(path.join(element.uri.fsPath, name)), type }));
		}
		console.log(`fileExplorer: ${this.subfolder}`);
		if (vscode.workspace.workspaceFile === undefined) {
			console.log('No workspace opened');
			
			return [];
		}
		const wrkspc = this.getFileFolder(vscode.workspace.workspaceFile!);
		const workspaceFolder = this.subfolder === undefined ? wrkspc : vscode.Uri.file(path.join(wrkspc.path, this.subfolder)); 
		
		if (workspaceFolder) {
			const children = await this.readDirectory(workspaceFolder);
			children.sort((a, b) => {
				if (a[1] === b[1]) {
					return a[0].localeCompare(b[0]);
				}
				return a[1] === vscode.FileType.Directory ? -1 : 1;
			});
			return children.map(([name, type]) => ({ uri: vscode.Uri.file(path.join(workspaceFolder.fsPath, name)), type }));
		}

		return [];
	}

	getTreeItem(element: Entry): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.uri, element.type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		if (element.type === vscode.FileType.File) {
			treeItem.command = { command: Constants.gmaCommandExplorerOpenFile, title: "Open File", arguments: [element.uri], };
			treeItem.contextValue = 'file';
		} else if (element.type === vscode.FileType.Directory) {
			treeItem.contextValue = 'directory';
		}
		return treeItem;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class FileExplorer {
	constructor(context: vscode.ExtensionContext, view: string, subFolderName?: string | undefined) {
		
		const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) => {
			vscode.commands.getCommands().then(commands => {
				console.log(commands);
				const collapse = commands.filter(c => c.includes('collapseAll'));	
				const pobox = commands.filter(c => c===command);
				const isFound = commands.find(c => c===command);
				if (isFound === undefined) {
					try{
						return context.subscriptions.push(vscode.commands.registerCommand(command, callback, thisArg));
					} catch(e) {
						console.log(e);
						console.log(`command: ${command} - pobox: ${pobox} isFound: ${isFound}`);
					}
				}
			});
		};

		const treeDataProvider = new FileSystemProvider(subFolderName);
		context.subscriptions.push(
			vscode.window.createTreeView(view, { treeDataProvider , showCollapseAll: true , canSelectMany: true }));

		registerCommand(Constants.gmaCommandExplorerOpenFile, (resource) => this.openResource(resource));
		registerCommand(Constants.gmaCommandExplorerAddToFolders, (resource) => this.addToFolders(resource.uri));
		registerCommand(Constants.gmaCommandExplorerAddRootToFolders, (resource) => this.addRootToFolders());
		registerCommand(Constants.gmaCommandExplorerRefresh, (resource) => treeDataProvider.refresh());
		
	}
	
	private openResource(resource: vscode.Uri): void {
		vscode.window.showTextDocument(resource);
	}
	private addToFolders(resource: vscode.Uri){
		const stats = fs.statSync(resource.fsPath);
		console.log(`stats: ${stats} isDirectory: ${stats.isDirectory()}`);
		if (stats.isDirectory()) {
			vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders!.length, 0, { uri: resource });
			const items = vscode.workspace.getConfiguration().get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
			if (!items.includes(resource.fsPath)) {
				const rootPath = path.dirname(vscode.workspace.workspaceFile!.fsPath);
				const relative = path.relative(rootPath, resource.fsPath);
				items.push(relative);
				vscode.workspace.getConfiguration().update(Constants.gmaConfigCustomWorkspaceFolders, items, vscode.ConfigurationTarget.Global);
			}
		} else {
			vscode.window.showErrorMessage('Please select a folder');
		}
	}
	private addRootToFolders(){
		const resource = vscode.Uri.file( path.dirname(vscode.workspace.workspaceFile!.fsPath));
		const stats = fs.statSync(resource.fsPath);
		console.log(`stats: ${stats} isDirectory: ${stats.isDirectory()}`);
		if (stats.isDirectory()) {
			vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders!.length, 0, { uri: resource });
			const items = vscode.workspace.getConfiguration().get<string[]>(Constants.gmaConfigCustomWorkspaceFolders) ?? [];
			if (!items.includes(resource.fsPath)) {
				const rootPath = path.dirname(vscode.workspace.workspaceFile!.fsPath);
				const relative = path.relative(rootPath, resource.fsPath);
				items.push(relative);
				vscode.workspace.getConfiguration().update(Constants.gmaConfigCustomWorkspaceFolders, items, vscode.ConfigurationTarget.Global);
			}
		} else {
			vscode.window.showErrorMessage('Please select a folder');
		}
	}
}