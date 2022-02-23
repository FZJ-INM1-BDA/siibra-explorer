import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { IAV_DATASET_SHOW_DATASET_DIALOG_CMP } from "./const";
import { DialogDirective } from "./dialog.directive"
import { DialogCmp } from "./dialog/dialog.component"

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    ComponentsModule,
  ],
  declarations: [
    DialogDirective,
    DialogCmp,
  ],
  exports: [
    DialogDirective,
    DialogCmp,
  ],
  providers: [
    {
      provide: IAV_DATASET_SHOW_DATASET_DIALOG_CMP,
      useValue: DialogCmp
    }
  ]
})

export class DialogInfoModule{}

export {
  DialogDirective,
  DialogCmp,
}