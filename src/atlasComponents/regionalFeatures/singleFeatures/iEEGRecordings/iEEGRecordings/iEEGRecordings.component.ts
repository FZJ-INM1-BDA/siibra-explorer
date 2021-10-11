import { Component, Inject, Optional, EventEmitter } from "@angular/core";
import { Store } from "@ngrx/store";
import { merge, Subject, Subscription } from "rxjs";
import { debounceTime, map, scan, take } from "rxjs/operators";
import { viewerStateChangeNavigation } from "src/services/state/viewerState/actions";
import { RegionalFeaturesService } from "src/atlasComponents/regionalFeatures/regionalFeature.service";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { IHasId } from "src/util/interfaces";
import { RegionFeatureBase } from "../../base/regionFeature.base";
import { ISingleFeature } from '../../interfaces'

const selectedColor = [ 255, 0, 0 ]

@Component({
  templateUrl: './iEEGRecordings.template.html',
  styleUrls: [
    './iEEGRecordings.style.css'
  ]
})

export class IEEGRecordingsCmp extends RegionFeatureBase implements ISingleFeature{
  private landmarksLoaded: IHasId[] = []
  private onDestroyCb: (() => void)[] = []
  private sub: Subscription[] = []

  constructor(
    private regionFeatureService: RegionalFeaturesService,
    private store: Store<any>,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) private regClickIntp: ClickInterceptor,
  ){
    super(regionFeatureService)
  }

  public viewChanged = new EventEmitter<boolean>()

  ngOnInit(){
    if (this.regClickIntp) {
      const { deregister, register } = this.regClickIntp
      const clickIntp = this.clickIntp.bind(this)
      register(clickIntp)
      this.onDestroyCb.push(() => {
        deregister(clickIntp)
      })
    }
    this.sub.push(
      this.data$.subscribe(data => {
        const landmarksTobeLoaded: IHasId[] = []
        
        for (const datum of data) {
          const electrodeId = datum['@id']
          landmarksTobeLoaded.push(
            ...datum['contactPoints'].map(({ ['@id']: contactPtId, position }) => {
              return {
                _: {
                  electrodeId,
                  contactPtId
                },
                ['@id']: `${electrodeId}#${contactPtId}`,
                position
              }
            })
          )
        }
        /**
         * remove first, then add
         */
        if (this.landmarksLoaded.length > 0) this.regionFeatureService.removeLandmarks(this.landmarksLoaded)
        if (landmarksTobeLoaded.length > 0) this.regionFeatureService.addLandmarks(landmarksTobeLoaded)
        this.landmarksLoaded = landmarksTobeLoaded
      })
    )

    this.sub.push(
      this.dataIsLoading$.subscribe(() => this.viewChanged.emit(true))
    )

    this.onDestroyCb.push(() => {
      if (this.landmarksLoaded.length > 0) this.regionFeatureService.removeLandmarks(this.landmarksLoaded)
    })

    this.sub.push(
      this.openElectrodeId$.pipe(
        debounceTime(200)
      ).subscribe(arr => {

        if (this.landmarksLoaded.length > 0) {
          this.regionFeatureService.removeLandmarks(this.landmarksLoaded)
          this.regionFeatureService.addLandmarks(this.landmarksLoaded.map(lm => {
            const selected = arr.some(id => id === lm['_']['electrodeId'])
            return {
              ...lm,
              color: selected ? selectedColor : null,
              showInSliceView: selected
            }
          }))
        }
      })
    )
  }


  ngOnDestroy(){
    while(this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
    while(this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  handleContactPtClk(contactPt: IHasId & { position: number[] }){
    const { position } = contactPt
    this.store.dispatch(
      viewerStateChangeNavigation({
        navigation: {
          position: position.map(v => v * 1e6),
          positionReal: true,
          animation: {}
        },
      })
    )
  }

  handleDatumExpansion(electrodeId: string, open: boolean){
    /**
     * TODO either debounce call here, or later down stream
     */
    if (open) this.exploreElectrode$.next(electrodeId)
    else this.unExploreElectrode$.next(electrodeId)
  }

  private unExploreElectrode$ = new Subject<string>()
  private exploreElectrode$ = new Subject<string>()
  public openElectrodeId$ = merge(
    this.unExploreElectrode$.pipe(
      map(id => ({
        add: null,
        remove: id
      }))
    ),
    this.exploreElectrode$.pipe(
      map(id => ({
        add: id,
        remove: null
      }))
    )
  ).pipe(
    scan((acc, curr) => {
      const { add, remove } = curr
      const set = new Set(acc)
      if (add) set.add(add)
      if (remove) set.delete(remove)
      return Array.from(set)
    }, [])
  )

  private clickIntp(ev: any): boolean {
    let hoveredLandmark = null
    this.regionFeatureService.onHoverLandmarks$.pipe(
      take(1)
    ).subscribe(val => {
      hoveredLandmark = val
    })
    if (!hoveredLandmark) return true
    const isOne = this.landmarksLoaded.some(lm => {
      return lm['_']['electrodeId'] === hoveredLandmark['_']['electrodeId']
    })
    if (!isOne) return true
    this.exploreElectrode$.next(hoveredLandmark['_']['electrodeId'])
  }
}
