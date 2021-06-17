import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { Subject } from "rxjs";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { LineUpdateCmp } from "./line/line.component";
import { PointUpdateCmp } from "./point/point.component";
import { PolyUpdateCmp } from "./poly/poly.component";
import { ModularUserAnnotationToolService } from "./service";
import { ToFormattedStringPipe } from "./toFormattedString.pipe";
import { ANNOTATION_EVENT_INJ_TOKEN } from "./type";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
  ],
  declarations: [
    LineUpdateCmp,
    PolyUpdateCmp,
    PointUpdateCmp,
    ToFormattedStringPipe,
  ],
  exports: [
    LineUpdateCmp,
    PolyUpdateCmp,
    PointUpdateCmp,
  ],
  providers: [
    {
      provide: ANNOTATION_EVENT_INJ_TOKEN,
      useValue: new Subject()
    },
    ModularUserAnnotationToolService
  ]
})

export class UserAnnotationToolModule {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_svc: ModularUserAnnotationToolService){}
}
