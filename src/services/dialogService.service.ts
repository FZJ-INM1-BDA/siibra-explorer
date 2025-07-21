import { Injectable } from "@angular/core";
import { ConfirmDialogComponent } from "src/components/confirmDialog/confirmDialog.component";
import { DialogComponent } from "src/components/dialog/dialog.component";
import { MatDialog,  MatDialogRef } from 'src/sharedModules/angularMaterial.exports'

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

  #restorableDialogs: (() => MatDialogRef<any>)[] = []
  #dialogToCbMap = new WeakMap<() => MatDialogRef<any>, () => void>()
  #fnToDialogMap = new WeakMap<() => MatDialogRef<any>, MatDialogRef<any>>()
  #registerRD(openDialog: () => MatDialogRef<any>, onClose: () => void){
    this.#restorableDialogs.push(openDialog)
    this.#dialogToCbMap.set(openDialog, onClose)
  }
  #openRD(openDialog: () => MatDialogRef<any>, onClose: () => void){

    const dialog = openDialog()
    dialog.afterClosed().subscribe(val => {
      if (val !== DIALOG_TEMP_HIDDEN) {
        onClose()
        this.deregisterAndCloseRestorableDialog(openDialog)
      }
    })
    this.#fnToDialogMap.set(openDialog, dialog)
  }
  deregisterAndCloseRestorableDialog(openDialog: () => MatDialogRef<any>){
    const idx = this.#restorableDialogs.indexOf(openDialog)
    if (idx < 0) {
      return
    }
    const fns = this.#restorableDialogs.splice(idx, 1)
    if (fns.length !== 1) {
      console.error(`deregister fns length !== 1`)
      return
    }
    const fn = fns[0]
    const ref = this.#fnToDialogMap.get(fn)
    ref.close()
  }
  public registerAndOpenRestorableDialog(openDialog: () => MatDialogRef<any>, onClose: () => void){
    this.#registerRD(openDialog, onClose)
    this.#openRD(openDialog, onClose)
  }

  public closeRestorableDialogs(){
    for (const fn of this.#restorableDialogs){
      this.#fnToDialogMap.get(fn)?.close(DIALOG_TEMP_HIDDEN)
    }
  }
  public openRestorableDialogs(){
    for (const openDialog of this.#restorableDialogs){
      const onClose = this.#dialogToCbMap.get(openDialog)
      if (!onClose){
        console.error(`Error: onclose fn cannot be found, continuing...`)
        continue
      }
      this.#openRD(openDialog, onClose)
    }
  }
}

export const DIALOG_TEMP_HIDDEN = Symbol("DIALOG_TEMP_HIDDEN")

export interface DialogConfig {
  title: string
  placeholder: string
  defaultValue: string
  message: string
  markdown?: string
  iconClass: string
  confirmOnly: boolean
}
