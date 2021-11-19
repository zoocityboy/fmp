import * as vscode from 'vscode';
export default function(val: {webview: vscode.Webview, extensionUri: vscode.Uri, url: vscode.Uri},) {
    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(val.extensionUri, 'media', 'reset.css');
    const stylesPathMainPath = vscode.Uri.joinPath(val.extensionUri, 'media', 'webview.css');
    const scriptUriPath = vscode.Uri.joinPath(val.extensionUri, 'media', 'script.js');
    // Uri to load styles into webview
    const stylesResetUri = val.webview.asWebviewUri(styleResetPath);
    const stylesMainUri = val.webview.asWebviewUri(stylesPathMainPath);
    const scriptUri = val.webview.asWebviewUri(scriptUriPath);
    const nonce = getNonce();
    const cspSource = val.webview.cspSource;
    //
    return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" 
                    content="default-src 'none'; 
                    frame-src ${cspSource} http: https:; 
                    img-src ${cspSource}; 
                    style-src ${cspSource}; 
                    script-src 'nonce-${nonce}';
                    "/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <meta http-equiv="cache-control" content="max-age=0" />
                <meta http-equiv="cache-control" content="no-cache" />
                <meta http-equiv="expires" content="0" />
                <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
                <meta http-equiv="pragma" content="no-cache" />
                <link href="${stylesResetUri}" rel="stylesheet"/>
				<link href="${stylesMainUri}" rel="stylesheet"/> 
            </head>
            <body>
                <div class="iframe">
                    <div class="vertical-center">
                        <h1>Flutter web app is not ready yet.</h1>
                        <p>you should build web app and then run.</p>
                        <p>&nbsp;</p>
                        <div>
                            <button onclick="doRefactor()" class="secondary">Build</button>
                            <button onclick="doRefactor()">Run</button>
                        </div>
                    </div>
                </div> 
            </body>
        </html>
        `;
  };

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}