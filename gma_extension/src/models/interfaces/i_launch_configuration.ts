
/**
 * Configuration for a vscode launch.json
 * used to configuration of launch.json in workspace file
 */
export interface ILaunchConfiguration {
    args: string[];
    name: string;
    program: string;
    request: string;
    type: string;
    cwd: string;
    windows:object,
    linux: object,
    osx: object,
    presentation:{
        group: string,
        hidden: boolean
    }
}