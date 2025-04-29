import { Directive, EventEmitter, inject, Input, OnChanges, Output } from "@angular/core";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { AnnotationLayer, TNgAnnotationAABBox, TNgAnnotationLine, TNgAnnotationPoint } from "./annotation.service";
import { Subscription } from "rxjs";

@Directive({
  selector: '[ng-annotations]',
  hostDirectives: [ DestroyDirective ],
  standalone: true
})
export class AnnotationDirective implements OnChanges {
  destroyed$ = inject(DestroyDirective).destroyed$

  @Input()
  annotationLayerName: string = null

  @Input()
  annotationColor: string = null

  @Input()
  annotations: (TNgAnnotationPoint|TNgAnnotationLine|TNgAnnotationAABBox)[] = []

  @Output()
  onHover = new EventEmitter<string|null>()

  #annLayer: AnnotationLayer = null

  #annLayerOnHoverSub: Subscription
  #createAnnLayer(){
    if (!this.annotationLayerName) {
      throw new Error(`annotationLayerName must be defined`)
    }
    if (!this.annotationColor) {
      throw new Error(`annotationColor must be defined`)
    }
    this.#annLayer = AnnotationLayer.Get(
      this.annotationLayerName,
      this.annotationColor
    )
    
    this.#annLayer.addAnnotation(this.annotations)
    this.#annLayerOnHoverSub = this.#annLayer.onHover.subscribe(val => {
      this.onHover.emit(val?.id)
    })
  }

  #clearAnnlayer(){
    if (this.#annLayerOnHoverSub) {
      this.#annLayerOnHoverSub.unsubscribe()
      this.#annLayerOnHoverSub = null
    }
    if (this.#annLayer) {
      this.#annLayer.dispose()
      this.#annLayer = null
    }
  }

  ngOnChanges(): void {
    this.#clearAnnlayer()
    this.#createAnnLayer()
  }

  constructor(){
    this.destroyed$.subscribe(() => {
      this.#clearAnnlayer()
    })
  }
}
