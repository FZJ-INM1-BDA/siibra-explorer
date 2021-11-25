import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TransformOnhoverSegmentPipe } from "src/atlasViewer/onhoverSegment.pipe";
import { MouseHoverDirective } from "./mouseover.directive";
import { MouseOverConvertPipe } from "./mouseOverCvt.pipe";


@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    MouseHoverDirective,
    TransformOnhoverSegmentPipe,
    MouseOverConvertPipe,
  ],
  exports: [
    MouseHoverDirective,
    TransformOnhoverSegmentPipe,
    MouseOverConvertPipe,
  ]
})

export class MouseoverModule{}