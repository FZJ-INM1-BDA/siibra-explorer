import { Directive } from "@angular/core"
import { select, Store } from "@ngrx/store"
import { merge, Observable } from "rxjs"
import { distinctUntilChanged, filter, map, scan, shareReplay, startWith, withLatestFrom } from "rxjs/operators"
import { LoggingService } from "src/logging"
import { uiStateMouseOverSegmentsSelector, uiStateMouseoverUserLandmark } from "src/services/state/uiState/selectors"
import { viewerStateSelectedParcellationSelector } from "src/services/state/viewerState/selectors"
import { deserialiseParcRegionId } from "common/util"
import { temporalPositveScanFn } from "./util"
import {ModularUserAnnotationToolService} from "src/atlasComponents/userAnnotations/tools/service";

@Directive({
  selector: '[iav-mouse-hover]',
  exportAs: 'iavMouseHover',
})

export class MouseHoverDirective {

  public onHoverObs$: Observable<{annotation: any, segments: any, landmark: any, userLandmark: any}>
  public currentOnHoverObs$: Observable<{annotation: any, segments: any, landmark: any, userLandmark: any}>

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
      select('uiState'),
      select('mouseOverLandmark'),
    ).pipe(
      map(landmark => {
        if (landmark === null) { return landmark }
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
      filter(v => !!v),
      withLatestFrom(
        this.store$.pipe(
          select(viewerStateSelectedParcellationSelector),
          startWith(null),
        ),
      ),
      map(([ arr, parcellationSelected ]) => parcellationSelected && parcellationSelected.auxillaryMeshIndices
        ? arr.filter(({ segment }) => {
          // if segment is not a string (i.e., not labelIndexId) return true
          if (typeof segment !== 'string') { return true }
          const { labelIndex } = deserialiseParcRegionId(segment)
          return parcellationSelected.auxillaryMeshIndices.indexOf(labelIndex) < 0
        })
        : arr),
      distinctUntilChanged((o, n) => o.length === n.length
        && n.every(segment =>
          o.find(oSegment => oSegment.layer.name === segment.layer.name
            && oSegment.segment === segment.segment))),
    )

    const onHoverAnnotation$ = this.annotSvc.hoveringAnnotations$.pipe(
      map(a => {
        if (a) {
          const annotationType = a.constructor.name
          return {
            name: a.name? a.name : `Unnamed ${annotationType.toLowerCase()}`,
            icon: {
              fontSet: 'fas',
              fontIcon: annotationType === 'Polygon' ? 'fa-draw-polygon'
                : annotationType === 'Point'? 'fa-circle'
                  : annotationType === 'Line' ? 'fa-slash' : '',
            }
          }
        } else {
          return null
        }
      })
    )

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

    this.onHoverObs$ = mergeObs.pipe(
      scan((acc, curr) => {
        return {
          ...acc,
          ...curr,
        }
      }, { annotation: null, segments: null, landmark: null, userLandmark: null }),
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
