import {Component} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import { CONST } from 'common/constants'
import { PERMISSION_DIALOG_ACTIONS } from "../constrants";

@Component({
  selector: 'quick-tour-start-dialog',
  templateUrl: './startTourDialog.template.html',
})
export class StartTourDialogDialog {
  public CONST = CONST
  public PERMISSION_DIALOG_ACTIONS = PERMISSION_DIALOG_ACTIONS
  constructor(public dialogRef: MatDialogRef<StartTourDialogDialog>) {}
}
