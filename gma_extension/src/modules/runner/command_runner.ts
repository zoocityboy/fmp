import { commands, Disposable, ExtensionContext, window } from "vscode";
import { Constants } from "../../models/constants";
import { Process } from "../../core/processes";
import { RunnerPickItem } from "../../models/interfaces/i_runner_picker";
import { ProgressStatus } from "../../models";
import { ServerTreeProvider } from "../servers/server_runner";
import { GmaConfig } from "../flavor/workspace_config";
import { UiProgress } from '../../core/progress';
export class CommandRunner {
  private items: RunnerPickItem[] = [];
  static register(context: ExtensionContext) {
    const runner = new CommandRunner();
    context.subscriptions.push(
      commands.registerCommand(Constants.gmaCommandPicker, () => runner.showQuickPick()),
    );
  }
  constructor() {
    
    console.log(GmaConfig.instance.data?.platformSupportedRunners);
    this.loadCommands();
  }
  private loadCommands() {
    try {
      GmaConfig.instance.load();
      this.items =GmaConfig.instance.data?.platformSupportedRunners?.map(runner => {
        return {
          label: runner.name,
          detail: `$(chevron-right) ${runner.run}`,
          description: runner.description,
          alwaysShow: true,
          run: runner.run.split(" ") ?? [],
        } as RunnerPickItem;
      }) ?? [];
    } catch (e) {
     void window.showErrorMessage(`${e}`);
    }

  }
  async showQuickPick() {
    this.loadCommands();
    const disposables: Disposable[] = [];
    await new Promise<RunnerPickItem | undefined>((resolve) => {
      const input = window.createQuickPick<RunnerPickItem>();
      input.title = "Run predefined command";
      input.items = this.items;
      // let 
      disposables.push(
        input.onDidChangeSelection(items => {
          const item = items[0];
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
            void UiProgress.instance.hideAfterDelay(item.label, "Command executed successfully");
          } else {
            void UiProgress.instance.hideAfterDelay(item.label, "Command failed");
          }
          
        }).catch(e => {
          console.log(e);
          void window.showErrorMessage(`${e}`);

        }).finally(() => {
          console.log("finally");
          ServerTreeProvider.instance.refresh();
        });
      }
    }).catch(e => {
      void window.showErrorMessage(`${e}`);
    }).finally(() => {
      disposables.forEach(d => {
        d.dispose();
      });
    });
  }  
}
