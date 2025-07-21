import { Component, inject, Input } from "@angular/core";
import { AnnotationListDirective } from "../directives/annotation.directive";
import { ModularUserAnnotationToolService } from "../tools/service";
import { BehaviorSubject, combineLatest } from "rxjs";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { takeUntil } from "rxjs/operators";
import { AnnotationLayer } from "src/atlasComponents/annotations";

const LAYER_NAME = `annotation-preview`
const LAYER_COLOR = `#00ffff`

@Component({
  selector: 'simple-annotation-list',
  templateUrl: './simpleAnnotList.template.html',
  styleUrls: [
    './simpleAnnotList.style.scss'
  ],
  hostDirectives: [
    DestroyDirective
  ]
})

export class SimpleAnnotationList extends AnnotationListDirective{
  
  #destroyed$ = inject(DestroyDirective).destroyed$

  #show$ = new BehaviorSubject(false)
  @Input()
  set show(val: boolean){
    this.#show$.next(val)
  }

  constructor(
    annotSvc: ModularUserAnnotationToolService
  ){
    super(annotSvc)
    combineLatest([
      this.#show$,
      this.managedAnnotations$
    ]).pipe(
      takeUntil(this.#destroyed$)
    ).subscribe({
      next: ([ show, annots ]) => {
        const layer = AnnotationLayer.Get(LAYER_NAME, LAYER_COLOR)
        const ngAnnot = annots.map(v => v.toNgAnnotation()).flatMap(v => v)
        layer.updateAnnotation(ngAnnot)
        layer.setVisible(show)
      },
      complete: () => {
        const layer = AnnotationLayer.Get(LAYER_NAME, LAYER_COLOR)
        layer.dispose()
      }
    })
  }
}
