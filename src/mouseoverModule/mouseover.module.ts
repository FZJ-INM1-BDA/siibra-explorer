import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TransformOnhoverSegmentPipe } from "src/atlasViewer/onhoverSegment.pipe";
import { MouseHoverDirective } from "./mouseover.directive";
import { MouseOverIconPipe } from "./mouseOverIcon.pipe";
import { MouseOverTextPipe } from "./mouseOverText.pipe";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    MouseHoverDirective,
    MouseOverTextPipe,
    TransformOnhoverSegmentPipe,
    MouseOverIconPipe,
  ],
  exports: [
    MouseHoverDirective,
    MouseOverTextPipe,
    TransformOnhoverSegmentPipe,
    MouseOverIconPipe,
  ]
})

export class MouseoverModule{}