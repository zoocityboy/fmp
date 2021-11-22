
import * as vscode from 'vscode';

export class BrowserPanel {
    
    public static currentPanel: BrowserPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    public static readonly viewType = 'browser';
    public url: string = 'https://www.google.com';

    public static show(extensionUri: vscode.Uri, url: string) {
        
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (BrowserPanel.currentPanel) {
            BrowserPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            BrowserPanel.viewType,
            "Browser",
            column || vscode.ViewColumn.One,
            BrowserPanel.getWebviewOptions(extensionUri),
        );
        BrowserPanel.currentPanel = new BrowserPanel(panel, extensionUri);
        BrowserPanel.currentPanel.url = url;
    }
    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        BrowserPanel.currentPanel = new BrowserPanel(panel, extensionUri);
    }
    public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
        return {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources','browser')]
        };
    }
    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
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
        this._update();

    }
    public static load(url: string) {
        if (BrowserPanel.currentPanel) {
            BrowserPanel.currentPanel.url = url;
            BrowserPanel.currentPanel._update();
            return;
        }
    }
    public _load(url: string) {
        vscode.env.asExternalUri(
            vscode.Uri.parse(url)
        ).then(uri => {
            const webview = this._panel.webview;
            this._panel.webview.html = this._getHtmlForWebview(webview, uri);
        });
    }
   

    public dispose() {
        BrowserPanel.currentPanel = undefined;
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
            vscode.Uri.parse(this.url)
        );
        const webview = this._panel.webview;
        // this._panel.webview.html = this._genHtmlRunnerWebview(webview);
        this._panel.webview.html = this._getHtmlForWebview(webview, url);
    }

    private _getHtmlForWebview(webview: vscode.Webview, uri: vscode.Uri) {
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'resources','browser', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'resources','browser', 'webview.css');
        const scriptUriPath = vscode.Uri.joinPath(this._extensionUri, 'resources','browser', 'script.js');
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
                <!--<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${uri} ${cspSource} http: https:; img-src ${cspSource}; style-src ${uri} ${cspSource}; script-src ${uri} 'nonce-${nonce}';"> -->
                <meta http-equiv="Content-Security-Policy" content="
					default-src 'none';
					connect-src ${uri};
					font-src ${this._panel.webview.cspSource};
					style-src ${this._panel.webview.cspSource};
					script-src 'nonce-${nonce}';
					frame-src ${uri} http https;
				">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="cache-control" content="max-age=0" />
                <meta http-equiv="cache-control" content="no-cache" />
                <meta http-equiv="expires" content="0" />
                <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
                <meta http-equiv="pragma" content="no-cache" />
                <link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet"> 
            </head>
            <body>
                <iframe id="iframe-content" src="${uri}" frameborder="0" scroll="no"/>
                <script type="text/javascript" nonce="${nonce}" src="${scriptUri}"></script>  
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