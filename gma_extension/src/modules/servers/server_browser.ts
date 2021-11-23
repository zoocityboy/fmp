
// import * as vscode from 'vscode';
// import indexPage from './templates/index.html';
// import errorPage from './templates/404.html';
// import { Constants, GmaAppConfiguration } from '../../models';

// export class LocalhostBrowserPanel {
//     private _panel: vscode.WebviewPanel;
//     private readonly _extensionUri: vscode.Uri;
//     private _disposables: vscode.Disposable[] = [];
//     private app: GmaAppConfiguration;
//     public viewType = 'gma.browser';
//     public static _viewType = 'gma.browser.';
//     public currentPanel: LocalhostBrowserPanel | undefined;

//     public getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
//         return {
//             enableScripts: true,
//             enableCommandUris: true,
//             localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources','webview')]
//         };
//     }

//     private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, app: GmaAppConfiguration) {
//         this.viewType = LocalhostBrowserPanel._viewType + app.packageName;
//         this.app = app;
//         this._panel = panel;
//         this._extensionUri = extensionUri;
//         this._update();
//         this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
//         this._panel.onDidChangeViewState(
//             e => {
//                 console.log('onDidChangeViewState: ${e}');
//                 if (this._panel.visible) {
//                     this._update();
//                 }
//             },
//             null,
//             this._disposables
//         );
//         this._panel.webview.onDidReceiveMessage(
//             message => {
//                 console.log(message);
//                 switch (message.command) {
//                     case 'alert':
//                         vscode.window.showErrorMessage(message.text);
//                         return;
//                     case 'refactor':
//                         vscode.window.showErrorMessage(message.text);
//                         return;
//                     case 'build':
//                         vscode.window.showErrorMessage(message.text);
//                         return;
//                 }
//             },
//             null,
//             this._disposables
//         );
//     }

//     public createOrShow(extensionUri: vscode.Uri, app: GmaAppConfiguration): LocalhostBrowserPanel | undefined {
// 		const column = vscode.window.activeTextEditor
// 			? vscode.window.activeTextEditor.viewColumn
// 			: undefined;

// 		// If we already have a panel, show it.
// 		if (this.currentPanel) {
// 			this.currentPanel._panel.reveal(column);
// 			return;
// 		}

// 		// Otherwise, create a new panel.
// 		const panel = vscode.window.createWebviewPanel(
// 			LocalhostBrowserPanel._viewType + app.packageName,
// 			'Cat Coding',
// 			column || vscode.ViewColumn.One,
// 			this.getWebviewOptions(extensionUri),
// 		);

// 		this.currentPanel = new LocalhostBrowserPanel(panel, extensionUri, app);
//         return this.currentPanel;
// 	}

//     public dispose() {
//         this.currentPanel = undefined;

// 		// Clean up our resources
// 		this._panel.dispose();

// 		while (this._disposables.length) {
// 			const x = this._disposables.pop();
// 			if (x) {
// 				x.dispose();
// 			}
// 		}
//     }

//     private async _update() {
//         const url = await vscode.env.asExternalUri(
//             vscode.Uri.parse(`http://localhost:${this.app.port}?time=${Date.now()}`)
//         );
//         this._panel.webview.html = indexPage({webview: this._panel.webview, extensionUri: this._extensionUri, url: url });
//     }

//     private _genHtmlRunnerWebview(webview: vscode.Webview) {
//         return errorPage({webview: webview, extensionUri: this._extensionUri, url: vscode.Uri.parse(`http://localhost:${this.app.port}`)});
//     }

//     public revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, app: GmaAppConfiguration) {
//         this.currentPanel = new LocalhostBrowserPanel(panel, extensionUri, app);
//     }
    
//     public static register(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, app: GmaAppConfiguration) : LocalhostBrowserPanel {
//         const value = new LocalhostBrowserPanel(panel, context.extensionUri, app); 
//         context.subscriptions.push(vscode.commands.registerCommand(Constants.gmaCommandServerShow, () => value));
//         value.createOrShow(context.extensionUri, app)!;
//         return value;
//     }

// }