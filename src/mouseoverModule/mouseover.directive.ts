import { Directive } from "@angular/core"
import { select, Store } from "@ngrx/store"
import { merge, Observable } from "rxjs"
import { distinctUntilChanged, map, scan, shareReplay } from "rxjs/operators"
import { LoggingService } from "src/logging"
import { uiStateMouseOverLandmarkSelector, uiStateMouseOverSegmentsSelector, uiStateMouseoverUserLandmark } from "src/services/state/uiState/selectors"
import { TOnHoverObj, temporalPositveScanFn } from "./util"
import { ModularUserAnnotationToolService } from "src/atlasComponents/userAnnotations/tools/service";

@Directive({
  selector: '[iav-mouse-hover]',
  exportAs: 'iavMouseHover',
})

export class MouseHoverDirective {

  public currentOnHoverObs$: Observable<TOnHoverObj>

  constructor(
    private store$: Store<any>,
    private log: LoggingService,
    private annotSvc: ModularUserAnnotationToolService,
  ) {

    // TODO consider moving these into a single obs serviced by a DI service
    // can potentially net better performance

    const onHoverUserLandmark$ = this.store$.pipe(
      select(uiStateMouseoverUserLandmark)
    )

    const onHoverLandmark$ = this.store$.pipe(
      select(uiStateMouseOverLandmarkSelector)
    ).pipe(
      map(landmark => {
        if (landmark === null) { return null }
        const idx = Number(landmark.replace('label=', ''))
        if (isNaN(idx)) {
          this.log.warn(`Landmark index could not be parsed as a number: ${landmark}`)
          return {
            landmarkName: idx,
          }
        } 
      }),
    )

    const onHoverSegments$ = this.store$.pipe(
      select(uiStateMouseOverSegmentsSelector),

      // TODO fix aux mesh filtering

      // withLatestFrom(
      //   this.store$.pipe(
      //     select(viewerStateSelectedParcellationSelector),
      //     startWith(null as any),
      //   ),
      // ),
      // map(([ arr, parcellationSelected ]) => parcellationSelected && parcellationSelected.auxillaryMeshIndices
      //   ? arr.filter(({ segment }) => {
      //     // if segment is not a string (i.e., not labelIndexId) return true
      //     if (typeof segment !== 'string') { return true }
      //     const { labelIndex } = deserialiseParcRegionId(segment)
      //     return parcellationSelected.auxillaryMeshIndices.indexOf(labelIndex) < 0
      //   })
      //   : arr),
    )

    const onHoverAnnotation$ = this.annotSvc.hoveringAnnotations$

    const mergeObs = merge(
      onHoverSegments$.pipe(
        distinctUntilChanged(),
        map(segments => {
          return { segments }
        }),
      ),
      onHoverAnnotation$.pipe(
        distinctUntilChanged(),
        map(annotation => {
          return { annotation }
        }),
      ),
      onHoverLandmark$.pipe(
        distinctUntilChanged(),
        map(landmark => {
          return { landmark }
        }),
      ),
      onHoverUserLandmark$.pipe(
        distinctUntilChanged(),
        map(userLandmark => {
          return { userLandmark }
        }),
      ),
    ).pipe(
      shareReplay(1),
    )

    this.currentOnHoverObs$ = mergeObs.pipe(
      scan(temporalPositveScanFn, []),
      map(arr => {

        let returnObj = {
          segments: null,
          annotation: null,
          landmark: null,
          userLandmark: null,
        }

        for (const val of arr) {
          returnObj = {
            ...returnObj,
            ...val
          }
        }

        return returnObj
      }),
      shareReplay(1),
    )
  }
}
