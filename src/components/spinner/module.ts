import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SpinnerCmp } from "./spinnerCmp/spinner.component";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    SpinnerCmp
  ],
  exports: [
    SpinnerCmp
  ]
})

export class SpinnerModule{}