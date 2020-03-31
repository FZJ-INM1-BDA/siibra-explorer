import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { ClipboardCopy } from "./clipboardCopy.directive";

@NgModule({
  imports: [
    AngularMaterialModule
  ],
  declarations: [
    ClipboardCopy
  ],
  exports: [
    ClipboardCopy
  ]
})

export class ShareModule{}
