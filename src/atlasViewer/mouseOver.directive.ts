import { Directive, Pipe, PipeTransform, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, Observable } from "rxjs";
import { distinctUntilChanged, filter, map, scan, shareReplay, startWith, withLatestFrom } from "rxjs/operators";
import { TransformOnhoverSegmentPipe } from "src/atlasViewer/onhoverSegment.pipe";
import { LoggingService } from "src/logging";
import { getNgIdLabelIndexFromId, IavRootStoreInterface } from "src/services/stateStore.service";

/**
 * Scan function which prepends newest positive (i.e. defined) value
 *
 * e.g. const source = new Subject()
 * source.pipe(
 *  scan(temporalPositveScanFn, [])
 * ).subscribe(this.log.log) // outputs
 *
 *
 *
 */
export const temporalPositveScanFn = (acc: Array<{segments: any, landmark: any, userLandmark: any}>, curr: {segments: any, landmark: any, userLandmark: any}) => {

  const keys = Object.keys(curr)

  // empty array is truthy
  const isPositive = keys.some(key => Array.isArray(curr[key])
    ? curr[key].length > 0
    : !!curr[key]
  )

  return isPositive
    ? [curr, ...(acc.filter(item => !keys.some(key => !!item[key])))] as Array<{segments?: any, landmark?: any, userLandmark?: any}>
    : acc.filter(item => !keys.some(key => !!item[key]))
}

@Directive({
  selector: '[iav-mouse-hover]',
  exportAs: 'iavMouseHover',
})

export class MouseHoverDirective {

  public onHoverObs$: Observable<{segments: any, landmark: any, userLandmark: any}>
  public currentOnHoverObs$: Observable<{segments: any, landmark: any, userLandmark: any}>

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private log: LoggingService,
  ) {

    // TODO consider moving these into a single obs serviced by a DI service
    // can potentially net better performance

    const onHoverUserLandmark$ = this.store$.pipe(
      select('uiState'),
      select('mouseOverUserLandmark'),
    )

    const onHoverLandmark$ = combineLatest(
      this.store$.pipe(
        select('uiState'),
        select('mouseOverLandmark'),
      ),
      this.store$.pipe(
        select('dataStore'),
        select('fetchedSpatialData'),
        startWith([]),
      ),
    ).pipe(
      map(([landmark, spatialDatas]) => {
        if (landmark === null) { return landmark }
        const idx = Number(landmark.replace('label=', ''))
        if (isNaN(idx)) {
          this.log.warn(`Landmark index could not be parsed as a number: ${landmark}`)
          return {
            landmarkName: idx,
          }
        } else {
          return {
            ...spatialDatas[idx],
            landmarkName: spatialDatas[idx].name,
          }
        }
      }),
    )

    const onHoverSegments$ = this.store$.pipe(
      select('uiState'),
      select('mouseOverSegments'),
      filter(v => !!v),
      withLatestFrom(
        this.store$.pipe(
          select('viewerState'),
          select('parcellationSelected'),
          startWith(null),
        ),
      ),
      map(([ arr, parcellationSelected ]) => parcellationSelected && parcellationSelected.auxillaryMeshIndices
        ? arr.filter(({ segment }) => {
          // if segment is not a string (i.e., not labelIndexId) return true
          if (typeof segment !== 'string') { return true }
          const { labelIndex } = getNgIdLabelIndexFromId({ labelIndexId: segment })
          return parcellationSelected.auxillaryMeshIndices.indexOf(labelIndex) < 0
        })
        : arr),
      distinctUntilChanged((o, n) => o.length === n.length
        && n.every(segment =>
          o.find(oSegment => oSegment.layer.name === segment.layer.name
            && oSegment.segment === segment.segment))),
    )

    const mergeObs = merge(
      onHoverSegments$.pipe(
        distinctUntilChanged(),
        map(segments => {
          return { segments }
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
      }, { segments: null, landmark: null, userLandmark: null }),
      shareReplay(1),
    )

    this.currentOnHoverObs$ = mergeObs.pipe(
      scan(temporalPositveScanFn, []),
      map(arr => arr[0]),
      map(val => {
        return {
          segments: null,
          landmark: null,
          userLandmark: null,
          ...val,
        }
      }),
      shareReplay(1),
    )
  }
}

@Pipe({
  name: 'mouseOverTextPipe',
})

export class MouseOverTextPipe implements PipeTransform {

  private transformOnHoverSegmentPipe: TransformOnhoverSegmentPipe
  constructor(private sanitizer: DomSanitizer) {
    this.transformOnHoverSegmentPipe = new TransformOnhoverSegmentPipe(this.sanitizer)
  }

  private renderText = ({ label, obj }): SafeHtml[] => {
    switch (label) {
    case 'landmark': {
      const { dataset = [] } = obj
      return [
        this.sanitizer.sanitize(SecurityContext.HTML, obj.landmarkName),
        ...(dataset.map(ds => this.sanitizer.bypassSecurityTrustHtml(`
<span class="text-muted">
  ${this.sanitizer.sanitize(SecurityContext.HTML, ds.name)}
</span>
`)))
      ]
    }
    case 'segments':
      return obj.map(({ segment }) => this.transformOnHoverSegmentPipe.transform(segment))
    case 'userLandmark':
      return [this.sanitizer.sanitize(SecurityContext.HTML, obj.id)]
    default:
      // ts-lint:disable-next-line
      console.warn(`mouseOver.directive.ts#mouseOverTextPipe: Cannot be displayed: label: ${label}`)
      return [this.sanitizer.bypassSecurityTrustHtml(`Cannot be displayed: label: ${label}`)]
    }
  }

  public transform(inc: {segments: any, landmark: any, userLandmark: any}): Array<{label: string, text: SafeHtml[]}> {
    const keys = Object.keys(inc)
    return keys
      // if is segments, filter out if lengtth === 0
      .filter(key => Array.isArray(inc[key]) ? inc[key].length > 0 : true )
      // for other properties, check if value is defined
      .filter(key => !!inc[key])
      .map(key => {
        return {
          label: key,
          text: this.renderText({ label: key, obj: inc[key] })
        }
      })
  }
}

@Pipe({
  name: 'mouseOverIconPipe',
})

export class MouseOverIconPipe implements PipeTransform {

  public transform(type: string): {fontSet: string, fontIcon: string} {

    switch (type) {
    case 'landmark':
      return {
        fontSet: 'fas',
        fontIcon: 'fa-map-marker-alt',
      }
    case 'segments':
      return {
        fontSet: 'fas',
        fontIcon: 'fa-brain',
      }
    case 'userLandmark':
      return {
        fontSet: 'fas',
        fontIcon: 'fa-map-marker-alt',
      }
    default:
      return {
        fontSet: 'fas',
        fontIcon: 'fa-file',
      }
    }
  }
}
