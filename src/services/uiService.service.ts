import { Injectable } from "@angular/core";
import {MatSnackBar, MatSnackBarConfig} from "@angular/material/snack-bar";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
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

  public showMessage(message: string, actionBtnTxt: string = 'Dismiss', config?: Partial<MatSnackBarConfig>) {
    return this.snackbar.open(message, actionBtnTxt, config)
  }

  public showDialog(data: unknown, options: MatDialogConfig){
    return this.dialog.open(ActionDialog, {
      ...options,
      data
    })
  }
}
