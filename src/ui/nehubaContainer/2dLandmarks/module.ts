import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlatLMCmp } from "./flatLm/flatLm.component";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    FlatLMCmp,
  ],
  exports: [
    FlatLMCmp,
  ]
})

export class Landmark2DModule{}
