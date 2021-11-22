
import { Disposable, QuickInput, QuickInputButtons, QuickPickItem, window } from "vscode";
import { IQuickPickParameters } from "../interfaces/i_quick_pick_parameters";
import { BuildStep } from "./input_step";
import { InputFlowAction as FlowAction } from "./flow_action";

/**
 * BuildFlow is a helper class to handle the QuickPick UI for a set of
 * build steps.
 * Brings functionality for handling actions like back, choose, and cancel.
 */
export class BuildFlow{

	private current?: QuickInput;
	private steps: BuildStep[] = [];

    static async run(start: BuildStep) {
		const input = new BuildFlow();
		return input.stepThrough(start);
	}

	private async stepThrough(start: BuildStep) {
		let step: BuildStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
                
			} catch (err) {
				if (err === FlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === FlowAction.resume) {
					step = this.steps.pop();
				} else if (err === FlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showQuickPick<T extends QuickPickItem, P extends IQuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createQuickPick<T>();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
				if (activeItem) {
					input.activeItems = [activeItem];
				}
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				disposables.push(
					input.onDidTriggerButton(item => {
                        console.log(`onDidTriggerButton ${typeof item}`);
						if (item === QuickInputButtons.Back) {
							reject(FlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidChangeSelection(items => resolve(items[0])),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? FlowAction.resume : FlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}