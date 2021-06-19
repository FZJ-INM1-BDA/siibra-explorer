import { OnDestroy } from "@angular/core";
import { Observable, Subject, Subscription } from "rxjs";
import { filter } from 'rxjs/operators'
import { Point } from "./point";
import { AbsToolClass, IAnnotationEvents, IAnnotationGeometry, IAnnotationTools, TAnnotationEvent, TCallbackFunction, TNgAnnotationPoint, TToolType } from "./type";

export class ToolSelect extends AbsToolClass<Point> implements IAnnotationTools, OnDestroy {

  public subs: Subscription[] = []
  toolType: TToolType = 'selecting'
  iconClass = 'fas fa-mouse-pointer'
  name = 'Select'

  onMouseMoveRenderPreview(){
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addAnnotation(){}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  removeAnnotation(){}

  managedAnnotations$ = new Subject<Point[]>()
  allNgAnnotations$ = new Subject<TNgAnnotationPoint[]>()
  constructor(
    annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>,
    callback: TCallbackFunction
  ){
    super(annotationEv$, callback)
    this.init()
  }

  private highLightedAnnotation: IAnnotationGeometry
  private allManAnnotations: IAnnotationGeometry[] = []
  init(){
    if (this.callback) {
      const obs$ = this.callback({ type: 'requestManAnnStreeam' })
      if (!obs$) throw new Error(`Error requestManAnnStreeam`)
      this.subs.push(
        /**
         * Get stream of all managed annotations
         */
        obs$.subscribe(manAnn => {
          this.allManAnnotations = manAnn
        }),

        /**
         * on hover ng annotatoin
         */
        this.hoverAnnotation$.subscribe(ev => {
          this.highLightedAnnotation?.setHighlighted(false)
          const annId = ev?.detail?.pickedAnnotationId
          if (!annId) return
          for (const manan of this.allManAnnotations) {
            if (manan.getNgAnnotationIds().indexOf(annId) >= 0) {
              manan.setHighlighted(true)
              this.highLightedAnnotation = manan
              return
            }
          }
        }),

        /**
         * on deselect tool
         */
        this.toolSelected$.pipe(
          filter(flag => !flag)
        ).subscribe(() => {
          this.highLightedAnnotation?.setHighlighted(false)
        })
      )
    }
  }

  ngOnDestroy(){
    while (this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}