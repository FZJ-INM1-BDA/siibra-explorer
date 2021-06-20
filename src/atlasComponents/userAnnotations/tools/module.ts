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
import { ANNOTATION_EVENT_INJ_TOKEN, } from "./type";
import { Line, ToolLine } from "src/atlasComponents/userAnnotations/tools/line";

import { Point, ToolPoint } from "./point";
import { ToolSelect } from "./select";
import { ToolDelete } from "./delete";
import { Polygon, ToolPolygon } from "./poly";

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

  constructor(svc: ModularUserAnnotationToolService){
    const selTool = svc.registerTool({
      toolCls: ToolSelect
    })
    svc.defaultTool = selTool

    svc.registerTool({
      toolCls: ToolPoint,
      target: Point,
      editCmp: PointUpdateCmp,
    })

    svc.registerTool({
      toolCls: ToolLine,
      target: Line,
      editCmp: LineUpdateCmp,
    })

    svc.registerTool({
      toolCls: ToolPolygon,
      target: Polygon,
      editCmp: PolyUpdateCmp,
    })

    svc.registerTool({
      toolCls: ToolDelete
    })
  }
}
