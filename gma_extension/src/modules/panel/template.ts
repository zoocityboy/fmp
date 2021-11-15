import * as vscode from 'vscode';

export class WebTemplate {
    private readonly _extensionUri: vscode.Uri;
    public constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }
    
    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    public content(webview: vscode.Webview, uri: vscode.Uri) {
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css');
        const scriptUriPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'script.js');
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        const scriptUri = webview.asWebviewUri(scriptUriPath);
        const nonce = this.getNonce();

        const cspSource = webview.cspSource;


        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${uri} ${cspSource} http: https:; img-src ${cspSource}; style-src ${uri} ${cspSource}; script-src ${uri} 'nonce-${nonce}';">
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
    public placeholder(webview: vscode.Webview) {
        const cspSource = webview.cspSource;
        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    *,body{
                        margin:0;padding:0px;
                    }
                    iframe{
                        display: block;       /* iframes are inline by default */
                        border: none;         /* Reset default border */
                        height: 100vh;        /* Viewport-relative units */
                        width: 100vw;
                    }
                </style>
            </head>
            <body>
                <h1>Widget catalog is not ready yet.</h1>
                <p>you can simply run build of the widget catalog</p>

            </body>
        </html>
        `;
    }
    
}