import { Injectable } from "@angular/core";
import { ToastHandler } from "src/util/pluginHandlerClasses/toastHandler";
import {MatSnackBar, MatSnackBarConfig} from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { ActionDialog } from "src/ui/actionDialog/actionDialog.component";

@Injectable({
  providedIn: 'root',
})

export class UIService {
  constructor(
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) {
  }

  public getToastHandler = () => {
    const toasthandler = new ToastHandler()
    let handle
    toasthandler.show = () => {
      handle = this.showMessage(toasthandler.message, null, {
        duration: toasthandler.timeout,
      })
    }

    toasthandler.hide = () => {
      if (handle) { handle.dismiss() }
      handle = null
    }
    return toasthandler
  }

  public showMessage(message: string, actionBtnTxt: string = 'Dismiss', config?: Partial<MatSnackBarConfig>) {
    return this.snackbar.open(message, actionBtnTxt, config)
  }

  public showDialog(data, options){
    return this.dialog.open(ActionDialog, {
      ...options,
      data
    })
  }
}
