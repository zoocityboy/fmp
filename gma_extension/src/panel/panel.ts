
import * as vscode from 'vscode';

import { WebTemplate } from './template';

export class WebViewPanel {
    public currentPanel: WebViewPanel | undefined;
    private readonly _viewType: string = 'web-view-type';
    private readonly _title: string = 'Web view panel';
    private readonly _port: number = 9001;
    private _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    public readonly viewType = 'dynamicFormsPlayground';
    private readonly _webTemplate : WebTemplate;


    public show(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // // If we already have a panel, show it.
        // if (WebViewPanel.currentPanel) {
        //     WebViewPanel.currentPanel._panel.reveal(column);
        //     return;
        // }
        if (this._panel !== undefined) {
            this._panel.reveal(column);
            return;
        }
        this._panel = this.create(extensionUri);
    }


    public getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
        return {
            enableScripts: true,
            enableCommandUris: true,
            enableForms: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        };
    }
    private create(extensionUri: vscode.Uri): vscode.WebviewPanel {
        const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
        return vscode.window.createWebviewPanel(
            this._viewType,
            this._title,
            column || vscode.ViewColumn.One,
            this.getWebviewOptions(extensionUri),
        );
    }

    constructor(extensionUri: vscode.Uri, viewType: string, title: string, port: number,) {
        this._viewType = viewType;
        this._title = title;
        this._port = port;
        this._extensionUri = extensionUri;
        this._panel = this.create(extensionUri);
        this._webTemplate = new WebTemplate(this._extensionUri);
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.onDidChangeViewState(
            e => {
                console.log(e);
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
                }
            },
            null,
            this._disposables
        );
    }

    public doRefactor() {
        this._panel.webview.postMessage({ command: 'refactor' });
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
            vscode.Uri.parse(`http://localhost:${this._port}`)
        );
        const webview = this._panel.webview;
        this._panel.webview.html = this._webTemplate.content(webview, url);
    }
   

}
