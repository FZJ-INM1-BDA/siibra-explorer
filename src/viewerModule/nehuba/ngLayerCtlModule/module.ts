import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SpinnerModule } from "src/components/spinner";
import { NgLayerCtrlCmp } from "./ngLayerCtl/ngLayerCtrl.component";

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    MatButtonModule,
    SpinnerModule,
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