import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BSFeatureReceptorModule } from "./receptor";
import { BsFeatureService } from "./service";

@NgModule({
  imports: [
    CommonModule,
    BSFeatureReceptorModule,
  ],
  providers: [
    BsFeatureService
  ],
  exports: [
    BSFeatureReceptorModule
  ]
})

export class BSFeatureModule{}
