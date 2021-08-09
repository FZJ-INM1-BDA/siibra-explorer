import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlatLMCmp } from "./flatLm/flatLm.component";
import { SafeStylePipe } from "./safeStyle.pipe";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    FlatLMCmp,

    /**
     * pipes
     */
    SafeStylePipe,
  ],
  exports: [
    FlatLMCmp,
  ]
})

export class Landmark2DModule{}
