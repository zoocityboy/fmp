
import * as vscode from 'vscode';
const dynamicWebServerPort = 9001;

export class WidgetCatalogPanel {
    public static currentPanel: WidgetCatalogPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    public static readonly viewType = 'widgetCatalog';

    public static show(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (WidgetCatalogPanel.currentPanel) {
            WidgetCatalogPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            WidgetCatalogPanel.viewType,
            "Widget Catalog",
            column || vscode.ViewColumn.One,
            WidgetCatalogPanel.getWebviewOptions(extensionUri),
        );
        WidgetCatalogPanel.currentPanel = new WidgetCatalogPanel(panel, extensionUri);
        WidgetCatalogPanel.checkSever();
    }
    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        WidgetCatalogPanel.currentPanel = new WidgetCatalogPanel(panel, extensionUri);
    }
    public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
        return {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        };
    }
    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
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
                    case 'start':
                        vscode.window.showErrorMessage(message.text);
                        return;
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
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    public static checkSever() {
        // let server = new net.Server(socket => {
        //     console.log('socket: %s', socket?.remoteAddress);
        // });
        // server.listen(
        //     dynamicWebServerPort,
        //     'localhost', () =>{
        //         console.log('listener');
        //     }
        // );
        // server.getConnections((error, count)=>{
        //     if (error !== undefined){
        //         console.error(`get connections error: ${error?.message}`);
        //     }
        //     console.warn(`connections: ${count}`);
        // });
    }
    public dispose() {
        WidgetCatalogPanel.currentPanel = undefined;

        // Clean up our resources
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
            vscode.Uri.parse(`http://localhost:${dynamicWebServerPort}`)
        );
        const webview = this._panel.webview;
        // this._panel.webview.html = this._genHtmlRunnerWebview(webview);
        this._panel.webview.html = this._getHtmlForWebview(webview, url);
    }


    private _getHtmlForWebview(webview: vscode.Webview, uri: vscode.Uri) {
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css');
        const scriptUriPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'script.js');
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        const scriptUri = webview.asWebviewUri(scriptUriPath);
        const nonce = getNonce();
        const cspSource = webview.cspSource;


        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-ancestors ${uri} ${cspSource}; frame-src ${uri} ${cspSource} http: https:; img-src ${cspSource}; style-src ${uri} ${cspSource}; script-src ${uri} ${cspSource} 'nonce-${nonce}';"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <meta http-equiv="cache-control" content="max-age=0" />
                <meta http-equiv="cache-control" content="no-cache" />
                <meta http-equiv="expires" content="0" />
                <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
                <meta http-equiv="pragma" content="no-cache" />
                <link href="${stylesResetUri}" rel="stylesheet"></link>
				<link href="${stylesMainUri}" rel="stylesheet"></link>
            </head>
            <body>
                <iframe id="iframe-content" src="${uri}" frameborder="0" scroll="no"></iframe>
                <script type="text/javascript" nonce="${nonce}" src="${scriptUri}"></script>  
            </body>
        </html>
        `;


    }
    private _genHtmlRunnerWebview(webview: vscode.Webview) {
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css');
        const scriptUriPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'script.js');
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        const scriptUri = webview.asWebviewUri(scriptUriPath);
        const nonce = getNonce();
        const cspSource = webview.cspSource;
        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${cspSource} http: https:; img-src ${cspSource}; style-src ${cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet"> 
            </head>
            <body>
                <div class="iframe">
                    <div class="vertical-center">
                        <h1>Widget catalog is not ready yet.</h1>
                        <p>you can simply run build of the widget catalog</p>
                        <p>&nbsp;</p>
                        <div>
                            <button onclick="doRefactor()" class="secondary">Refactor</button>
                            <button onclick="doRefactor()">Refactor</button>
                        </div>
                    </div>
                </div> 
            </body>
        </html>
        `;
    }

}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}