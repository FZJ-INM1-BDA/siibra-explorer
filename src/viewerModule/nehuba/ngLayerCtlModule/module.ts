import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { SpinnerModule } from "src/components/spinner";
import { NgLayerCtrlCmp } from "./ngLayerCtl/ngLayerCtrl.component";
import { AngularMaterialModule } from 'src/sharedModules/angularMaterial.module'


@NgModule({
  imports: [
    CommonModule,
    SpinnerModule,
    AngularMaterialModule,
  ],
  declarations: [
    NgLayerCtrlCmp
  ],
  exports: [
    NgLayerCtrlCmp
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class NgLayerCtlModule{

}