import { CommonModule } from "@angular/common"
import { NgModule } from "@angular/core"
import { AngularMaterialModule } from "src/sharedModules"
import * as ieeg from "./ieeg"
import * as receptor from "./receptors"

const {
  IEEGSessionCmp
} = ieeg
const {
  ReceptorViewModule
} = receptor

@NgModule({
  imports: [
    CommonModule,
    ReceptorViewModule,
    AngularMaterialModule,
  ],
  declarations: [
    IEEGSessionCmp,
  ],
  exports: [
    IEEGSessionCmp,
  ]
})
export class SapiViewsFeaturesModule{}