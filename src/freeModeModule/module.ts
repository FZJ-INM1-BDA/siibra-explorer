import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DragDropFileModule } from "src/dragDropFile";
import { AngularMaterialModule } from "src/sharedModules";
import { FreeModeUIComponent } from "./freemode-ui/freemode-ui.component";

@NgModule({
  imports: [
    CommonModule,
    DragDropFileModule,
    AngularMaterialModule,
  ],
  declarations: [
    FreeModeUIComponent,
  ],
  exports: [
    FreeModeUIComponent,
  ]
})

export class FreeModeModule{}
