import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from 'src/sharedModules/angularMaterial.module'
import { HideWhenLocal } from "./strictLocal.directive";
import { StrictLocalInfo } from "./strictLocalCmp/strictLocalCmp.component";

@NgModule({
  declarations: [
    HideWhenLocal,
    StrictLocalInfo,
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  exports: [
    HideWhenLocal,
  ]
})

export class StrictLocalModule{}
