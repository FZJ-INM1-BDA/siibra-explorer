import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LandmarkUnit } from "./landmarkUnit/landmarkUnit.component";
import { FlatLMCmp } from "./landmarkUnitMkII/flatLm.component";
import { SafeStylePipe } from "./safeStyle.pipe";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    LandmarkUnit,
    FlatLMCmp,

    /**
     * pipes
     */
    SafeStylePipe,
  ],
  exports: [
    LandmarkUnit,
    FlatLMCmp,
  ]
})

export class Landmark2DModule{}
