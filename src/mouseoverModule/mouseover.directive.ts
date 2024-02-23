import { Directive } from "@angular/core"
import { select, Store } from "@ngrx/store"
import { merge, Observable } from "rxjs"
import { distinctUntilChanged, map, scan } from "rxjs/operators"
import { TOnHoverObj, temporalPositveScanFn } from "./util"
import { ModularUserAnnotationToolService } from "src/atlasComponents/userAnnotations/tools/service";
import { userInteraction } from "src/state"
import { arrayEqual } from "src/util/array"
import { MouseOverSvc } from "./service"

@Directive({
  selector: '[iav-mouse-hover]',
  exportAs: 'iavMouseHover',
})

export class MouseHoverDirective {

  /**
   * TODO move
   * - mousing over regions
   * - hovering annotation
   * - hovering voi feature
   * to use hover interceptor
   */
  public currentOnHoverObs$: Observable<TOnHoverObj> = merge(
    this.store$.pipe(
      select(userInteraction.selectors.mousingOverRegions),
    ).pipe(
      distinctUntilChanged(arrayEqual((o, n) => o?.name === n?.name)),
      map(regions => {
        return { regions }
      }),
    ),
    this.annotSvc.hoveringAnnotations$.pipe(
      distinctUntilChanged(),
      map(annotation => {
        return { annotation }
      }),
    ),
    this.store$.pipe(
      select(userInteraction.selectors.mousingOverVoiFeature),
      distinctUntilChanged((o, n) => o?.id === n?.id),
      map(voi => ({ voi }))
    )
  ).pipe(
    scan(temporalPositveScanFn, []),
    map(arr => {

      let returnObj: TOnHoverObj = {
        regions: null,
        annotation: null,
        voi: null
      }

      for (const val of arr) {
        returnObj = {
          ...returnObj,
          ...val
        }
      }

      return returnObj
    }),
  )

  constructor(
    private store$: Store<any>,
    private annotSvc: ModularUserAnnotationToolService,
    private svc: MouseOverSvc,
  ) {
  }

  messages$ = this.svc.messages$
}
