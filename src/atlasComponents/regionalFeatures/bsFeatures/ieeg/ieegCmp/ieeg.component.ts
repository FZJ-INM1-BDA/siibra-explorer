import { Component, Inject, OnDestroy, Optional } from "@angular/core";
import { Store } from "@ngrx/store";
import { BehaviorSubject, forkJoin, merge, Observable, of, Subscription } from "rxjs";
import { catchError, mapTo, switchMap } from "rxjs/operators";
import { viewerStateAddUserLandmarks, viewerStateChangeNavigation, viewreStateRemoveUserLandmarks } from "src/services/state/viewerState/actions";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { REGISTERED_FEATURE_INJECT_DATA } from "../../constants";
import { BsFeatureService, TFeatureCmpInput } from "../../service";
import { TBSDEtail, TBSSummary, SIIBRA_FEATURE_KEY, TContactPoint, TElectrode } from '../type'
import { ARIA_LABELS, CONST } from 'common/constants'

@Component({
  selector: 'bs-feature-ieeg.cmp',
  templateUrl: './ieeg.template.html',
  styleUrls: [
    './ieeg.style.css'
  ]
})

export class BsFeatureIEEGCmp extends BsRegionInputBase implements OnDestroy{

  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  private featureId: string

  private results: (TBSSummary & TBSDEtail)[] = []
  constructor(
    private store: Store<any>,
    svc: BsFeatureService,
    @Optional() @Inject(REGISTERED_FEATURE_INJECT_DATA) data: TFeatureCmpInput,
  ){
    super(svc, data)
    if (data.featureId) this.featureId = data.featureId
    this.subs.push(
      this.results$.subscribe(results => {
        this.results = results
        this.loadLandmarks()
      })
    )
  }

  public results$: Observable<(TBSSummary & TBSDEtail)[]>  = this.region$.pipe(
    switchMap(() => this.getFeatureInstancesList(SIIBRA_FEATURE_KEY).pipe(
      switchMap(arr => forkJoin(arr.filter(it => {
        if (!this.featureId) return true
        return it['@id'] === this.featureId
      }).map(it => this.getFeatureInstance(SIIBRA_FEATURE_KEY, it["@id"])))),
      catchError(() => of([]))
    )),
  )

  public busy$ = this.region$.pipe(
    switchMap(() => merge(
      of(true),
      this.results$.pipe(
        mapTo(false)
      )
    )),
  )
  
  private subs: Subscription[] = []
  ngOnDestroy(){
    this.unloadLandmarks()
    while(this.subs.length) this.subs.pop().unsubscribe()
  }
  private openElectrodeSet = new Set<TElectrode>() 
  public openElectrode$ = new BehaviorSubject<TElectrode[]>([])
  handleDatumExpansion(electrode: TElectrode, state: boolean) {
    if (state) this.openElectrodeSet.add(electrode)
    else this.openElectrodeSet.delete(electrode)
    this.openElectrode$.next(Array.from(this.openElectrodeSet))
    this.loadLandmarks()
  }

  private loadedLms: {
    '@id': string
    id: string
    name: string
    position: [number, number, number]
    color: [number, number, number]
    showInSliceView: boolean
  }[] = []

  private unloadLandmarks(){
    /**
     * unload all the landmarks first
     */
    this.store.dispatch(
      viewreStateRemoveUserLandmarks({
        payload: {
          landmarkIds: this.loadedLms.map(l => l['@id'])
        }
      })
    )
  }

  private loadLandmarks(){
    this.unloadLandmarks()
    this.loadedLms = []

    const lms = [] as {
      '@id': string
      id: string
      name: string
      position: [number, number, number]
      color: [number, number, number]
      showInSliceView: boolean
    }[]

    for (const detail of this.results) {
      for (const subjectKey in detail.electrodes){
        const electrodes = detail.electrodes[subjectKey]
        for (const electrodId in electrodes) {
          const electrode = electrodes[electrodId]
          if (!electrode.inRoi) continue
          
          for (const cpKey in electrode.contact_points) {
            const cp = electrode.contact_points[cpKey]
            lms.push({
              "@id": `${detail.name}:${subjectKey}#${cpKey}`,
              id: `${detail.name}:${subjectKey}#${cpKey}`,
              name: `${detail.name}:${subjectKey}#${cpKey}`,
              position: cp.location,
              color: cp.inRoi ? [255, 100, 100]: [255, 255, 255],
              showInSliceView: this.openElectrodeSet.has(electrode)
            })
          }
        }
      }
    }
    this.loadedLms = lms

    this.store.dispatch(
      viewerStateAddUserLandmarks({
        landmarks: lms
      })
    )
  }

  handleContactPtClk(cp: TContactPoint) {
    const { location } = cp
    this.store.dispatch(
      viewerStateChangeNavigation({
        navigation: {
          position: location.map(v => v * 1e6),
          positionReal: true,
          animation: {}
        },
      })
    )
  }
}
