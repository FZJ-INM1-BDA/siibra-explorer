import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BS_ENDPOINT } from "./constants";
import { BSFeatureReceptorModule } from "./receptor";
import { BsFeatureService } from "./service";

@NgModule({
  imports: [
    CommonModule,
    BSFeatureReceptorModule,
  ],
  providers: [
    {
      provide: BS_ENDPOINT,
      useValue: `https://brainscapes.apps-dev.hbp.eu`
    },
    BsFeatureService
  ],
  exports: [
    BSFeatureReceptorModule
  ]
})

export class BSFeatureModule{}
