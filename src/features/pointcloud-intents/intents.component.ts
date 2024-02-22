import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { BehaviorSubject, Observable, combineLatest } from "rxjs";
import { Point, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";
import { AngularMaterialModule } from "src/sharedModules";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CFIndex } from "./util";
import { AnnotationLayer } from "src/atlasComponents/annotations";
import { map, takeUntil } from "rxjs/operators";

type Intent = PathReturn<"/feature/{feature_id}/intents">['items'][number]

type Annotation = {
  id: string
  type: 'point'
  point: [number, number, number]
}

function serializeToId(pt: Point): Annotation{
  return {
    id: `${pt.spaceId}-${pt.loc.join("-")}`,
    type: 'point',
    point: pt.loc.map(v => v*1e6) as [number, number, number]
  }
}

@Component({
  selector: 'pointcloud-intents',
  templateUrl: './intents.template.html',
  styleUrls: [
    './intents.style.css'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule
  ],
  hostDirectives: [
    DestroyDirective
  ]
})

export class PointCloudIntents {

  readonly #destroy$ = inject(DestroyDirective).destroyed$

  // not yet used
  #intents: Observable<Intent[]>

  #points$ = new BehaviorSubject<CFIndex<Point>[]>([] as CFIndex<Point>[])
  #selectedTemplate$ = new BehaviorSubject<SxplrTemplate>(null)

  @Input('points')
  set points(val: CFIndex<Point>[]) {
    this.#points$.next(val)
  }

  @Input('selected-template')
  set selectedTemplate(tmpl: SxplrTemplate){
    this.#selectedTemplate$.next(tmpl)
  }

  spaceMatchedPoints$ = combineLatest([
    this.#points$,
    this.#selectedTemplate$
  ]).pipe(
    map(([ points, selectedTemplate ]) => points.filter(p => p.index.spaceId === selectedTemplate?.id).map(v => v.index))
  )


  @Output('on-click')
  onClick = new EventEmitter<Point>()

  annLayer: AnnotationLayer
  constructor(){
    this.annLayer = new AnnotationLayer("intents", "#ff0000")
    this.spaceMatchedPoints$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(pts => {
      const anns = pts.map(serializeToId)
      this.annLayer.addAnnotation(anns)
    },
    e => {
      console.error("error", e)
    },
    () => {
      console.log("dismissing!")
      this.annLayer.dispose()
    })
  }

}
