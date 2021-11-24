import { GmaConfigurationFile } from "../../models/dto/yaml_file";
import { commands, Disposable, ExtensionContext, QuickPickItem, window } from "vscode";
import { Constants } from "../../models/constants";
import { YamlUtils } from "../../core/yaml_utils";
import { Process } from "../../core/processes";
import { RunnerPickItem } from "../../models/interfaces/i_runner_picker";
import { ProgressStatus } from "../../models";
import { ServerTreeProvider } from "../servers/server_runner";
export class CommandRunner {
  private _config: GmaConfigurationFile;
  private items: RunnerPickItem[] = [];
  static async register(context: ExtensionContext, config: GmaConfigurationFile): Promise<CommandRunner> {
    const runner = new CommandRunner({ config: config });
    context.subscriptions.push(
      commands.registerCommand(Constants.gmaCommandPicker, () => runner.showQuickPick()),
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
    await new Promise<RunnerPickItem | undefined>((resolve, _reject) => {
      const input = window.createQuickPick<RunnerPickItem>();
      input.title = "Run predefined command";
      input.items = this.items;
      // let 
      disposables.push(
        input.onDidChangeSelection(items => {
          const item = items[0] as RunnerPickItem;
          resolve(item);
          input.hide();
        }),
        input.onDidHide(() => {
          resolve(undefined);
          input.dispose();
        }),
        
      );
      input.show();
    }).then(item => {
      if (item !== undefined) {
        Process.instance.runCommand(item).then(status => {
          if (status === ProgressStatus.success) {
            window.showInformationMessage("Command executed successfully");
          } else {
            window.showErrorMessage("Command failed");
          }
          
        }).catch(e => {
          console.log(e);
          window.showErrorMessage(`${e}`);

        }).finally(() => {
          console.log("finally");
          ServerTreeProvider.instance.refresh();
        });
      }
      window.showInformationMessage(`${item?.run}`);
    }).catch(e => {
      window.showErrorMessage(`${e}`);
    }).finally(() => {
      disposables.forEach(d => d.dispose());
    });
  }
}
