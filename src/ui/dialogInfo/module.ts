import { NgModule } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { DialogDirective } from "./dialog.directive"

@NgModule({
  imports: [
    MatSnackBarModule,
    MatDialogModule,
  ],
  declarations: [
    DialogDirective,
  ],
  exports: [
    DialogDirective,
  ],
})

export class DialogModule{}
