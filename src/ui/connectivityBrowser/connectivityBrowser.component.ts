import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter, 
  OnDestroy,
  Output,
  ViewChild,
  Input,
} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Observable, Subscription, Subject, combineLatest} from "rxjs";
import {distinctUntilChanged, map } from "rxjs/operators";
import {CLEAR_CONNECTIVITY_REGION, SELECT_REGIONS, SET_CONNECTIVITY_VISIBLE} from "src/services/state/viewerState.store";
import { safeFilter} from "src/services/stateStore.service";
import { viewerStateNavigateToRegion } from "src/services/state/viewerState.store.helper";
import { ngViewerActionClearView } from "src/services/state/ngViewerState/actions";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState/selectors";
import { viewerStateAllRegionsFlattenedRegionSelector } from "src/services/state/viewerState/selectors";

const CONNECTIVITY_NAME_PLATE = 'Connectivity'

@Component({
    selector: 'connectivity-browser',
    templateUrl: './connectivityBrowser.template.html',
})
export class ConnectivityBrowserComponent implements AfterViewInit, OnDestroy{

    private setColorMap$: Subject<boolean> = new Subject()

    /**
     * accordion expansion should only toggle the clearviewqueue state
     * which should be the single source of truth
     * setcolormaps$ is set by the presence/absence of clearviewqueue[CONNECTIVITY_NAME_PLATE]
     */
    private _isFirstUpdate = true

    @Input()
    set accordionExpanded(flag: boolean){
      /**
       * ignore first update
       */
      if (this._isFirstUpdate) {
        this._isFirstUpdate = false
        return
      }
      this.store$.dispatch(
        ngViewerActionClearView({ payload: {
          [CONNECTIVITY_NAME_PLATE]: flag
        }})
      )
    }

    @Output()
    setOpenState: EventEmitter<boolean> = new EventEmitter()

    @Input()
    set region(val){
      const newRegionName = val && val.name

      if (!val) {
        this.store$.dispatch({
            type: SET_CONNECTIVITY_VISIBLE,
            payload: false,
        })
        return
      }

      if (newRegionName !== this.regionName && this.defaultColorMap) {
          this.restoreDefaultColormap()
      } 
      this.regionName = newRegionName

      // TODO may not be necessary
      this.changeDetectionRef.detectChanges()
    }
    
    public regionName: string
    public datasetList: any[] = []
    public selectedDataset: any
    public connectedAreas = []
    
    private selectedParcellationFlatRegions$ = this.store$.pipe(
      select(viewerStateAllRegionsFlattenedRegionSelector)
    )
    public overwrittenColorMap$: Observable<any>

    private subscriptions: Subscription[] = []
    public expandMenuIndex = -1
    public allRegions = []
    public defaultColorMap: Map<string, Map<number, {red: number, green: number, blue: number}>>

    @ViewChild('connectivityComponent', {read: ElementRef}) public connectivityComponentElement: ElementRef<HTMLHbpConnectivityMatrixRowElement>
    @ViewChild('fullConnectivityGrid') public fullConnectivityGridElement: ElementRef<HTMLFullConnectivityGridElement>

    constructor(
        private store$: Store<any>,
        private changeDetectionRef: ChangeDetectorRef,
    ) {

      this.overwrittenColorMap$ = this.store$.pipe(
        select('viewerState'),
        safeFilter('overwrittenColorMap'),
        map(state => state.overwrittenColorMap),
        distinctUntilChanged()
      )
    }

    public ngAfterViewInit(): void {

      this.subscriptions.push(
        this.store$.pipe(
          select(ngViewerSelectorClearViewEntries),
        ).subscribe(keys => {
          this.setColorMap$.next(keys.includes(CONNECTIVITY_NAME_PLATE))
        })
      )

      this.subscriptions.push(
        this.store$.pipe(
          select(ngViewerSelectorClearViewEntries),
        ).subscribe(keys => {
          this.setOpenState.emit(keys.includes(CONNECTIVITY_NAME_PLATE))
        })
      )

      this.subscriptions.push(
        this.selectedParcellationFlatRegions$.subscribe(flattenedRegions => {
          this.defaultColorMap = null
          this.allRegions = flattenedRegions
        }),
      )

      /**
       * setting/restoring colormap
       */
      this.subscriptions.push(
        combineLatest(
          this.setColorMap$.pipe(
            distinctUntilChanged()
          ),
          fromEvent(this.connectivityComponentElement.nativeElement, 'connectivityDataReceived').pipe(
            map((e: CustomEvent) => e.detail)
          )
        ).subscribe(([flag, connectedAreas]) => {

          this.connectedAreas = connectedAreas
          
          if (flag) {
            this.addNewColorMap()
            this.store$.dispatch({
              type: SET_CONNECTIVITY_VISIBLE,
              payload: 'connectivity',
            })
          } else {
            this.restoreDefaultColormap()

            /**
             * TODO
             * may no longer be necessary
             */
            this.store$.dispatch({type: CLEAR_CONNECTIVITY_REGION})
            this.store$.dispatch({type: SET_CONNECTIVITY_VISIBLE, payload: null})
          }
        })
      )

      this.subscriptions.push(
        fromEvent(this.connectivityComponentElement?.nativeElement, 'collapsedMenuChanged', { capture: true })
          .subscribe((e: CustomEvent) => {
            this.expandMenuIndex = e.detail
          }),
        fromEvent(this.connectivityComponentElement?.nativeElement, 'datasetDataReceived', { capture: true })
          .subscribe((e: CustomEvent) => {
            this.datasetList = e.detail
            this.selectedDataset = this.datasetList[0]
          }),
        fromEvent(this.connectivityComponentElement?.nativeElement, 'customToolEvent', { capture: true })
          .subscribe((e: CustomEvent) => {
            if (e.detail.name === 'export csv') {
              // ToDo Fix in future to use component
              const a = document.querySelector('hbp-connectivity-matrix-row')
              a.downloadCSV()
            }
          }),
      )
    }

    public ngOnDestroy(): void {
      this.subscriptions.forEach(s => s.unsubscribe())
    }
    
    // ToDo Affect on component
    changeDataset(event) {
      this.selectedDataset = event.value
    }

    navigateToRegion(region) {
      this.store$.dispatch(
        viewerStateNavigateToRegion({
          payload: { region: this.getRegionWithName(region) }
        })
      )
    }
    
    selectRegion(region) {
      this.store$.dispatch({
        type: SELECT_REGIONS,
        selectRegions: [region],
      })
    }

    getRegionWithName(region) {
      return this.allRegions.find(ar => ar.name === region)
    }

    public restoreDefaultColormap() {
      console.log('restore')
      debugger
      if (!this.defaultColorMap) return
      getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(this.defaultColorMap)
    }

    public addNewColorMap() {
      this.defaultColorMap = new Map(getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())

      const existingMap: Map<string, Map<number, {red: number, green: number, blue: number}>> = (getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())
      const colorMap = new Map(existingMap)

      this.allRegions.forEach(r => {
        if (r.ngId) {
          colorMap.get(r.ngId).set(r.labelIndex, {red: 255, green: 255, blue: 255})
        }
      })

      this.connectedAreas.forEach(area => {
        const areaAsRegion = this.allRegions
          .filter(r => r.name === area.name)
          .map(r => r)

        if (areaAsRegion && areaAsRegion.length && areaAsRegion[0].ngId) {
          colorMap.get(areaAsRegion[0].ngId).set(areaAsRegion[0].labelIndex, {red: area.color.r, green: area.color.g, blue: area.color.b})
        }
      })
      getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(colorMap)
    }

    exportConnectivityProfile() {
      const a = document.querySelector('hbp-connectivity-matrix-row')
      a.downloadCSV()
    }
    public exportFullConnectivity() {
      this.fullConnectivityGridElement.nativeElement['downloadCSV']()
    }

}

function getWindow(): any {
  return window
}
