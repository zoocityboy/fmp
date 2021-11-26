import * as vscode from 'vscode';
import { Constants } from '../models';

export type LoadingTask = { report: (message: string) => void; stop: () => void };
export class UiProgress{
    private loadings = new Map<string, LoadingTask>();
    private static _instance: UiProgress;
    public static get instance() {
        this._instance = this._instance ?? new UiProgress();
        return this._instance;
    }
    public async progress(id: string, text: string, stop = false, location?: vscode.ProgressLocation) {
        if (!this.loadings.has(id)) {
            const loading: LoadingTask = await this.createLoading(location);
            this.loadings.set(id, loading);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const _loading = this.loadings.get(id)!;
         if (_loading){ 
          _loading?.report(text);
          if (stop) {
              _loading?.stop();
            this.loadings.delete(id);
          }
        }
    }
    public async progressStatusBar(id: string, text: string, stop = false){
       await this.progress(id, text, stop, vscode.ProgressLocation.Window);
    }
    
    public async hideAfterDelay(id: string, message: string, ms?: number, location?: vscode.ProgressLocation) {
        await this.progress(id, message, false, location);
        await new Promise(resolve => setTimeout(resolve, ms ?? Constants.hideAfterDelay));
        await this.progress(id,"", true, location);
    }

    private createLoading = async (location?: vscode.ProgressLocation) => {
        return new Promise<LoadingTask>((resolve) => {
            const option = {
                location: location ?? vscode.ProgressLocation.Notification,
                title: '',
                cancellable: false,
            };
            void vscode.window.withProgress(option, (progress) => new Promise<void>((stop) => {
                const report = (message: string) => progress.report({ message });
                resolve({
                    report,
                    stop: () => stop(),
                });
            }));
        });
    }
}