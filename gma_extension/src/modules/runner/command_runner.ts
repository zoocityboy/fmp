import { GmaConfigurationFile } from "../../models/dto/yaml_file";
import { commands, Disposable, ExtensionContext, MessageItem, QuickPickItem, Uri, window, workspace } from "vscode";
import * as fs from "fs";
import path = require("node:path");
import { Constants } from "../../models/constants";
import { YamlUtils } from "../../core/yaml_utils";
import * as cp from 'child_process';
export class CommandRunner {
  private _config: GmaConfigurationFile;
  private items: RunnerPickItem[] = [];
  private rgs: cp.ChildProcess[] = [];
  static async register(context: ExtensionContext, config: GmaConfigurationFile): Promise<CommandRunner> {
    const runner = new CommandRunner({ config: config });
    context.subscriptions.push(
      commands.registerCommand(Constants.gmaCommandPicker, () => runner.showQuickPick()),
      // commands.registerCommand(Constants.gmaCommandTouchBarPicker, () => runner.showQuickPick()),
    );
    return runner;
  }
  constructor(val: { config: GmaConfigurationFile }) {
    this._config = val.config;
    console.log(this._config.platformSupportedRunners);
    this.loadCommands();
  }
  private loadCommands() {
    try {
      const yaml: GmaConfigurationFile | undefined = new YamlUtils().load();
      if (yaml !== undefined) {
        this._config = yaml!;
      }

      this.items = this._config.platformSupportedRunners?.map(runner => {
        return {
          label: runner.name,
          detail: `$(chevron-right) ${runner.run}`,
          description: runner.description,
          alwaysShow: true,
          run: runner.run.split(" ") ?? [],
        } as RunnerPickItem;
      }) ?? [];
    } catch (e) {
      window.showErrorMessage(`${e}`);
    }

  }
  async showQuickPick() {
    this.loadCommands();
    const disposables: Disposable[] = [];
    try {
      return await new Promise<Uri | undefined>((resolve, reject) => {
        const input = window.createQuickPick<RunnerPickItem>();
        input.title = "Run predefined command";
        input.items = this.items;
        // let 
        disposables.push(
          input.onDidChangeSelection(items => {
            const item = items[0];
            // resolve(item);
            input.hide();
          }),
          input.onDidHide(() => {
            resolve(undefined);
            input.dispose();
          }),
          input.onDidChangeValue(value => {
            input.busy = true;
            setTimeout(() => {
              input.busy = false;
            }, 2000);
          }),
          // input.onDidChangeValue(value => {
          //   // rgs.forEach(rg => rg.kill());
          //   // if (!value) {
          //   //   input.items = [];
          //   //   return;
          //   // }
          //   // input.busy = true;
          //   // const cwds = workspace.workspaceFolders ? workspace.workspaceFolders.map(f => f.uri.fsPath) : [process.cwd()];
          //   // const q = process.platform === 'win32' ? '"' : '\'';
          //   // rgs = cwds.map(cwd => {
          //   //   const rg = cp.exec(`rg --files -g ${q}*${value}*${q}`, { cwd }, (err, stdout) => {
          //   //     const i = rgs.indexOf(rg);
          //   //     if (i !== -1) {
          //   //       if (rgs.length === cwds.length) {
          //   //         input.items = [];
          //   //       }
          //   //       if (!err) {
          //   //         input.items = input.items.concat(
          //   //           stdout
          //   //             .split('\n').slice(0, 50)
          //   //             .map(relative => new FileItem(Uri.file(cwd), Uri.file(path.join(cwd, relative))))
          //   //         );
          //   //       }
          //   //       if (err && !(<any>err).killed && (<any>err).code !== 1 && err.message) {
          //   //         input.items = input.items.concat([
          //   //           new MessageItem(Uri.file(cwd), err.message)
          //   //         ]);
          //   //       }
          //   //       rgs.splice(i, 1);
          //   //       if (!rgs.length) {
          //   //         input.busy = false;
          //   //       }
          //   //     }
          //   //   });
          //   //
          //   // return;   //return rg;
          //   });
          // }),
          // input.onDidChangeSelection(items => {
          //   const item = items[0];
          //   if (item instanceof FileItem) {
          //     resolve(item.uri);
          //     input.hide();
          //   }
          // }),
          // input.onDidHide(() => {
          //   rgs.forEach(rg => rg.kill());
          //   resolve(undefined);
          //   input.dispose();
          // })
        );
        input.show();
      });
    } finally {
      disposables.forEach(d => d.dispose());
    }
  }
}
interface RunnerPickItem extends QuickPickItem {
  label: string;
  description?: string | undefined;
  detail?: string | undefined;
  picked?: boolean | undefined;
  alwaysShow?: boolean | undefined;
  run: string[];
}