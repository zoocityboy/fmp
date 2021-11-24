(function () {

    const vscode = acquireVsCodeApi();
    function doBuild(){
        vscode.postMessage({
            command: 'build'
        });
    }
    function doRun(){
        vscode.postMessage({
            command: 'run'
        });
    }
}());