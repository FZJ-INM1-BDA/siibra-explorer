import {Component} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'quick-tour-start-dialog',
  templateUrl: './startTourDialog.template.html',
})
export class StartTourDialogDialog {
  constructor(public dialogRef: MatDialogRef<StartTourDialogDialog>) {}
}
