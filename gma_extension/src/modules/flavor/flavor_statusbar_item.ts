import * as vscode from 'vscode';
import { Constants } from '../../models/constants';
import { ProgressStatus, IState } from '../../models';
export class FlavorStatusbarItem{
    private _disposable: vscode.Disposable;
    private _statusBarItem: vscode.StatusBarItem;   
    private _status: ProgressStatus|undefined;
    constructor(context: vscode.ExtensionContext, callback: (...args: any[]) => any){
        this._statusBarItem = vscode.window.createStatusBarItem(Constants.changeAppCommandId, vscode.StatusBarAlignment.Left, 99);
        this._statusBarItem.command = Constants.changeAppCommandId;
        this._disposable = vscode.commands.registerCommand(Constants.changeAppCommandId, () => callback());
        context.subscriptions.push(this._disposable);
        
    } 
    static register(context: vscode.ExtensionContext, callback: (...args: any[]) => any,): FlavorStatusbarItem {
        return new FlavorStatusbarItem(context, callback);
    }
    dispose(){
        this.hide();
        this._disposable.dispose();
    }
    update(val: {state?: IState | undefined, status: ProgressStatus | undefined}){
        this._status = val.status;
        var message: string = '';
        switch(val.status){
            case ProgressStatus.loading:
                this._statusBarItem.command = undefined;
                message = `$(sync~spin) Change flavor started...`;
            break;
            
            case ProgressStatus.failed:
                this._statusBarItem.command = Constants.changeAppCommandId;
                if (val.state !== undefined) {
                    message = `${val.state.country?.icon ?? ''} ${val.state.app?.label ?? ''} app in ${val.state.stage?.label ?? ''}`;
                } else {
                    message = `COUNTRY APP app in STAGE`;
                }
            break;
            case ProgressStatus.success:
                this._statusBarItem.command = Constants.changeAppCommandId;
                if (val.state !== undefined) {
                    message = `${val.state.country?.icon ?? ''} ${val.state.app?.label ?? ''} app in ${val.state.stage?.label ?? ''}`;
                } else {
                    message = `COUNTRY APP app in STAGE`;
                }
                
            break;
            default:
                message = '';
            break;
        }
        this._statusBarItem.text = message;
        this.show();
    }
    show(){
        this._statusBarItem.show();
    }
    hide(){
        this._statusBarItem.hide();
    }
}