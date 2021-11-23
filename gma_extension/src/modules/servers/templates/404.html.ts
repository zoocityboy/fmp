import * as vscode from 'vscode';
import { GmaAppConfiguration } from '../../../models';
export default function(val: {webview: vscode.Webview, extensionUri: vscode.Uri, url: vscode.Uri, app: GmaAppConfiguration},) {
    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(val.extensionUri, 'resources', 'webview', 'reset.css');
    const stylesPathMainPath = vscode.Uri.joinPath(val.extensionUri, 'resources', 'webview', 'webview.css');
    const scriptUriPath = vscode.Uri.joinPath(val.extensionUri, 'resources', 'webview', '404.js');
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
                <meta http-equiv="Content-Security-Policy" content="default-src 'unsafe-inline' 'unsafe-eval' vscode-resource: data: https: http:;">
               
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <link href="${stylesResetUri}" rel="stylesheet"/>
				<link href="${stylesMainUri}" rel="stylesheet"/> 
            </head>
            <body>
                <div class="iframe">
                    <div class="vertical-center center">
                        <h1>Flutter web app is not ready yet.</h1>
                        <p>you should build web app and then run.</p>
                        <p>&nbsp;</p>
                        
                    </div>
                </div> 
                <script type="text/javascript" noncex="${nonce}" src="${scriptUri}"></script>  
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