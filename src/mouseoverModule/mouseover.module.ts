import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TransformOnhoverSegmentPipe } from "./transformOnhoverSegment.pipe";
import { MouseHoverDirective } from "./mouseover.directive";
import { MouseOverConvertPipe } from "./mouseOverCvt.pipe";
import { HOVER_INTERCEPTOR_INJECTOR } from "src/util/injectionTokens";
import { MouseOverSvc } from "./service";


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
  ],
  providers: [
    MouseOverSvc,
    {
      provide: HOVER_INTERCEPTOR_INJECTOR,
      useFactory: (svc: MouseOverSvc) => {
        return {
          append: svc.append.bind(svc),
          remove: svc.remove.bind(svc),
        }
      },
      deps: [ MouseOverSvc ]
    }
  ]
})

export class MouseoverModule{}
