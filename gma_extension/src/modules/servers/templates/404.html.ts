import path = require('path');
import * as vscode from 'vscode';
import { GmaAppConfiguration } from '../../../models';
export default function (val: {context: vscode.ExtensionContext, webview: vscode.Webview, url: vscode.Uri, app: GmaAppConfiguration },) {
    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(val.context.extensionUri, 'resources', 'webview', 'reset.css');
    const stylesPathMainPath = vscode.Uri.joinPath(val.context.extensionUri, 'resources', 'webview', 'webview.css');
    // Uri to load styles into webview
    const stylesResetUri = val.webview.asWebviewUri(styleResetPath);
    const stylesMainUri = val.webview.asWebviewUri(stylesPathMainPath);
    const cspSource = val.webview.cspSource;

    const lightOnDiskPath = vscode.Uri.file(
        path.join(val.context.extensionPath, 'resources', 'images', 'gma_icon.svg')
      );
      const gmaLogoLight = val.webview.asWebviewUri(lightOnDiskPath);
      
    //
    return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; img-src 'unsafe-inline' ${cspSource};  font-src ${cspSource}; style-src 'unsafe-inline' ${cspSource};">
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <link href="${stylesResetUri}" rel="stylesheet"/>
				<link href="${stylesMainUri}" rel="stylesheet"/> 
            </head>
            <body class="vscode.body">
                <div class="editor-container">
                    <div class="vertical-center center" style="margin: 0 15em">
                        <div class="logo" style="background-image: url(${gmaLogoLight});"></div>
                        <h2>App is not ready yet.</h2>
                        <p>&nbsp;</p>
                        <p>Run or Build & run your web app.</p>
                        <p>&nbsp;</p>                    
                    </div>
                </div> 
            </body>
        </html>
        `;
};

// function getNonce() {
//     let text = '';
//     const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     for (let i = 0; i < 32; i++) {
//         text += possible.charAt(Math.floor(Math.random() * possible.length));
//     }
//     return text;
// }