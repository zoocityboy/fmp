
import * as vscode from 'vscode';
import indexPage from './templates/index.html';
import errorPage from './templates/404.html';
import { GmaAppConfiguration } from '../../models';

export class LocalhostBrowserPanel {
    public readonly type: string;
    private _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private app: GmaAppConfiguration;
    public viewType = 'gma.browser';

    public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
        return {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources','webview')]
        };
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, app: GmaAppConfiguration, type: string = 'browser') {
        this.viewType = `gma.browser.${type}`;
        this.type = type;
        this.app = app;
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.onDidChangeViewState(
            e => {
                console.log('onDidChangeViewState: ${e}');
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
        this._panel.webview.onDidReceiveMessage(
            message => {
                console.log(message);
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'refactor':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'build':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }
    public show(){
        this._panel.reveal();
        this._update();
    }

    public doRefactor() {
        this._panel.webview.postMessage({ command: 'refactor' });
    }

    public doBuild(){
        this._panel.webview.postMessage({ command: 'build' });
    }

    public dispose() {
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const url = await vscode.env.asExternalUri(
            vscode.Uri.parse(`http://localhost:${this.app.port}`)
        );
        this._panel.webview.html = indexPage({webview: this._panel.webview, extensionUri: this._extensionUri, url: url });
    }

    private _genHtmlRunnerWebview(webview: vscode.Webview) {
        return errorPage({webview: webview, extensionUri: this._extensionUri, url: vscode.Uri.parse(`http://localhost:${this.app.port}`)});
    }

    public revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        // WidgetCatalogPanel.currentPanel = new LocalhostBrowserPanel(panel, extensionUri);
    }
    public static create(context: vscode.ExtensionContext, app: GmaAppConfiguration){
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        const panel = vscode.window.createWebviewPanel(
            app.viewType,
            `${app.description ?? 'Browser'}`,
            column || vscode.ViewColumn.One,
            LocalhostBrowserPanel.getWebviewOptions(context.extensionUri),
        );
        return new LocalhostBrowserPanel(panel, context.extensionUri, app, app.packageName);
    }

    public static register(context: vscode.ExtensionContext, app: GmaAppConfiguration): LocalhostBrowserPanel {
        const value = LocalhostBrowserPanel.create(context, app);
        context.subscriptions.push(value);
        return value;
        
    }

}