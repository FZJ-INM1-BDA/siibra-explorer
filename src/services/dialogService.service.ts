import { Injectable } from "@angular/core";
import { ConfirmDialogComponent } from "src/components/confirmDialog/confirmDialog.component";
import { DialogComponent } from "src/components/dialog/dialog.component";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";

type TCancellable = {
  abort: () => void
}

@Injectable({
  providedIn: 'root',
})

export class DialogService {

  private dialogRef: MatDialogRef<DialogComponent>
  private confirmDialogRef: MatDialogRef<ConfirmDialogComponent>

  constructor(private dialog: MatDialog) {

  }

  public blockUserInteraction(config: Partial<DialogConfig>): TCancellable {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        ...config,
        hideActionBar: true
      },
      hasBackdrop: true,
      disableClose: true
    })
    const abort = () => dialogRef.close()
    return { abort }
  }

  public getUserConfirm(config: Partial<DialogConfig> = {}): Promise<string> {
    this.confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: config,
    })
    return new Promise((resolve, reject) => this.confirmDialogRef.afterClosed()
      .subscribe(val => {
        if (val) { resolve('Success') } else { reject('User cancelled') }
      },
      reject,
      () => this.confirmDialogRef = null))
  }

  public getUserInput(config: Partial<DialogConfig> = {}): Promise<string> {
    const {
      defaultValue = '',
      placeholder = 'Type your response here',
      title = 'Message',
      message = '',
      iconClass,
    } = config
    this.dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title,
        placeholder,
        defaultValue,
        message,
        iconClass,
      },
    })
    return new Promise((resolve, reject) => {
      /**
       * nb: one one value is ever emitted, then the subscription ends
       * Should not result in leak
       */
      this.dialogRef.afterClosed().subscribe(value => {
        if (value) { resolve(value) } else { reject('User cancelled input') }
        this.dialogRef = null
      })
    })
  }
}

export interface DialogConfig {
  title: string
  placeholder: string
  defaultValue: string
  message: string
  markdown?: string
  iconClass: string
  confirmOnly: boolean
}
