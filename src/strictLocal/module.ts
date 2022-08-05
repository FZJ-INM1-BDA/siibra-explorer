import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { HideWhenLocal } from "./strictLocal.directive";
import { StrictLocalInfo } from "./strictLocalCmp/strictLocalCmp.component";

@NgModule({
  declarations: [
    HideWhenLocal,
    StrictLocalInfo,
  ],
  imports: [
    CommonModule,
    MatTooltipModule,
    MatButtonModule,
  ],
  exports: [
    HideWhenLocal,
  ]
})

export class StrictLocalModule{}
