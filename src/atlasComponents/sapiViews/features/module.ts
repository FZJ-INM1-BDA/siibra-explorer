import { CommonModule } from "@angular/common"
import { NgModule } from "@angular/core"
import { AngularMaterialModule } from "src/sharedModules"
import * as ieeg from "./ieeg"
import * as receptor from "./receptors"

const {
  IEEGSessionCmp
} = ieeg
const {
  Autoradiography,
  Fingerprint,
  Profile,
} = receptor

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule
  ],
  declarations: [
    IEEGSessionCmp,
    Autoradiography,
    Fingerprint,
    Profile,
  ],
  exports: [
    IEEGSessionCmp,
    Autoradiography,
    Fingerprint,
    Profile,
  ]
})
export class SapiViewsFeaturesModule{}