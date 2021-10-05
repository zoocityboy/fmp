
import * as vscode from 'vscode';
import * as nodeFetch from 'node-fetch';
const dynamicWebServerPort = 9001;

export class BoardPanel {

    public static readonly viewType = 'catCodicons';

    public static show(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        const panel = vscode.window.createWebviewPanel(
            BoardPanel.viewType,
            "Widget Catalog",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,

            }
        );
        fetch('http://localhost:${dynamicWebServerPort}', {
            method: 'GET',
        }).then((response) =>
            response.text()
        );

        this._getHtmlForWebview(panel.webview, extensionUri).then((value) => {
            panel.webview.html = value;
        });
    }

    private static async _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri) {
        const nonce = getNonce();
        const fullWebServerUri = await vscode.env.asExternalUri(
            vscode.Uri.parse(`http://localhost:${dynamicWebServerPort}`)
        );
        const cspSource = webview.cspSource;
        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta
                    http-equiv="Content-Security-Policy"
                    content="default-src 'none'; frame-src ${fullWebServerUri} ${cspSource} https:; img-src ${fullWebServerUri} ${cspSource} https:; script-src ${fullWebServerUri} ${cspSource}; style-src 'unsafe-inline' ${fullWebServerUri}  ${cspSource};"
                />
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
                <iframe src="${fullWebServerUri}" frameborder="0" />
            </body>
        </html>
        `;

    }
    private static async _genHtmlRunnerWebview(webview: vscode.Webview) {
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
                <
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