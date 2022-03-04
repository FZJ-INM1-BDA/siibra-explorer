import { CommonModule } from "@angular/common"
import { NgModule } from "@angular/core"
import { AngularMaterialModule } from "src/sharedModules"
import { FeatureEntryCmp } from "./entry/entry.component"
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
    FeatureEntryCmp,
  ],
  exports: [
    IEEGSessionCmp,
    FeatureEntryCmp,
  ]
})
export class SapiViewsFeaturesModule{}