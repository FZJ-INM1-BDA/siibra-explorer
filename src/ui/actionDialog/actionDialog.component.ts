import { Component, Optional, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

interface IDialogAction{
  type: 'mat-button' | 'mat-flat-button' | 'mat-raised-button' | 'mat-stroked-button'
  color: 'primary' | 'accent' | 'warn' | 'default'
  dismiss: boolean
  text: string
  ariaLabel?: string
}

@Component({
  templateUrl: './actionDialog.template.html'
})

export class ActionDialog{

  public actions: IDialogAction[] = []
  public content: string
  public sameLine: boolean = false

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data: any
  ){
    const { config, content, actions = [] } = data || {}
    const { sameLine = false } = config || {}

    this.content = content
    this.sameLine = sameLine
    this.actions = actions
  }

}
