import { OnDestroy } from "@angular/core";
import { Observable, Subject, Subscription } from "rxjs";
import { filter, switchMapTo, takeUntil, withLatestFrom } from "rxjs/operators";
import { Point } from "./point";
import { AbsToolClass, IAnnotationEvents, IAnnotationGeometry, IAnnotationTools, TAnnotationEvent, TCallbackFunction, TNgAnnotationPoint, TToolType } from "./type";

export class ToolDelete extends AbsToolClass<Point> implements IAnnotationTools, OnDestroy {

  public subs: Subscription[] = []
  toolType: TToolType = 'deletion'
  iconClass = 'fas fa-trash'
  name = 'Delete'

  onMouseMoveRenderPreview(){
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addAnnotation(){}
  
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  removeAnnotation(){}

  managedAnnotations$ = new Subject<Point[]>()
  private allManAnnotations: IAnnotationGeometry[] = []
  allNgAnnotations$ = new Subject<TNgAnnotationPoint[]>()
  constructor(
    annotationEv$: Observable<TAnnotationEvent<keyof IAnnotationEvents>>,
    callback: TCallbackFunction
  ){
    super(annotationEv$, callback)
    this.init()
  }
  init(){
    if (this.callback) {
      const obs$ = this.callback({ type: 'requestManAnnStreeam' })
      if (!obs$) throw new Error(`Error requestManAnnStreeam`)

      const toolDeselect$ = this.toolSelected$.pipe(
        filter(flag => !flag)
      )
      const toolSelThenClick$ = this.toolSelected$.pipe(
        filter(flag => !!flag),
        switchMapTo(this.mouseClick$.pipe(
          takeUntil(toolDeselect$)
        ))
      )

      this.subs.push(
        /**
         * Get stream of all managed annotations
         */
        obs$.subscribe(manAnn => {
          this.allManAnnotations = manAnn
        }),
        toolSelThenClick$.pipe(
          withLatestFrom(this.hoverAnnotation$)
        ).subscribe(([ _, ev ]) => {
          const annId = ev?.detail?.pickedAnnotationId
          if (!annId) return
          for (const manan of this.allManAnnotations) {
            if (manan.getNgAnnotationIds().indexOf(annId) >= 0) {
              manan.remove()
              return
            }
          }
        })
      )
    }
  }


  ngOnDestroy(){
    while (this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
