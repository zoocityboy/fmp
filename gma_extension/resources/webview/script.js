
(function () {

    const vscode = acquireVsCodeApi();
    window.onload = function () {
        console.log("####### iframe in webview loaded");
        document.getElementById('iframe-content').onload = (handler, event) => {

            console.log("### onloaded iframe ");
            console.log(`handler: ${handler} event: ${event}`);
        };
        vscode.postMessage({
            command: 'onloadiframe'
        });
    };
    window.addEventListener('message', (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'onSearchKeywordReceived':
                // document.getElementById('iframe-content').src = message.url;
                document.getElementById('iframe-content').onload = (handler, event) => {

                    console.log("### onloaded iframe ");
                    console.log(`handler: ${handler} event: ${event}`);
                };
                break;
            case 'onloadiframe':
                var iframe = document.getElementById('iframe-content').src;
                console.log(iframe);
                break;
        }
    });
}());