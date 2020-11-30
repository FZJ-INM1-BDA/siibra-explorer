import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  Input,
  OnInit,
} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Observable, Subscription, Subject, combineLatest} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import {
  CLEAR_CONNECTIVITY_REGION,
  SELECT_REGIONS,
  SET_CONNECTIVITY_VISIBLE
} from "src/services/state/viewerState.store";
import {safeFilter} from "src/services/stateStore.service";
import {viewerStateNavigateToRegion} from "src/services/state/viewerState.store.helper";
import {ngViewerActionClearView} from "src/services/state/ngViewerState/actions";
import {ngViewerSelectorClearViewEntries} from "src/services/state/ngViewerState/selectors";
import {
  viewerStateAllRegionsFlattenedRegionSelector,
  viewerStateOverwrittenColorMap
} from "src/services/state/viewerState/selectors";
import {HttpClient} from "@angular/common/http";

const CONNECTIVITY_NAME_PLATE = 'Connectivity'

@Component({
  selector: 'connectivity-browser',
  templateUrl: './connectivityBrowser.template.html',
})
export class ConnectivityBrowserComponent implements OnInit, AfterViewInit, OnDestroy {

    private setColorMap$: Subject<boolean> = new Subject()

    /**
     * accordion expansion should only toggle the clearviewqueue state
     * which should be the single source of truth
     * setcolormaps$ is set by the presence/absence of clearviewqueue[CONNECTIVITY_NAME_PLATE]
     */
    private _isFirstUpdate = true

    public connectivityUrl = 'https://connectivity-query-v1-1-connectivity.apps-dev.hbp.eu/v1.1/studies'

    @Input()
    set accordionExpanded(flag: boolean) {
      /**
         * ignore first update
         */
      if (this._isFirstUpdate) {
        this._isFirstUpdate = false
        return
      }
      // this.store$.dispatch(
      //   ngViewerActionClearView({
      //     payload: {
      //       [CONNECTIVITY_NAME_PLATE]: flag
      //     }
      //   })
      // )
      this.store$.dispatch({
        type: SET_CONNECTIVITY_VISIBLE,
        payload: 'connectivity',
      })
    }

    @Output()
    setOpenState: EventEmitter<boolean> = new EventEmitter()

    @Output()
    connectivityLoadUrl: EventEmitter<string> = new EventEmitter()

    @Output() connectivityNumberReceived: EventEmitter<string> = new EventEmitter()

    @Input()
    set region(val) {
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
    public selectedDatasetDescription: string = ''
    public connectedAreas = []

    private selectedParcellationFlatRegions$ = this.store$.pipe(
      select(viewerStateAllRegionsFlattenedRegionSelector)
    )
    public overwrittenColorMap$: Observable<any>

    private subscriptions: Subscription[] = []
    public expandMenuIndex = -1
    public allRegions = []
    public defaultColorMap: Map<string, Map<number, { red: number, green: number, blue: number }>>

    public noDataReceived = false

    @ViewChild('connectivityComponent', {read: ElementRef}) public connectivityComponentElement: ElementRef<HTMLHbpConnectivityMatrixRowElement>
    @ViewChild('fullConnectivityGrid') public fullConnectivityGridElement: ElementRef<HTMLFullConnectivityGridElement>

    constructor(
        private store$: Store<any>,
        private changeDetectionRef: ChangeDetectorRef,
        private httpClient: HttpClient
    ) {

      this.overwrittenColorMap$ = this.store$.pipe(
        select('viewerState'),
        safeFilter('overwrittenColorMap'),
        map(state => state.overwrittenColorMap),
        distinctUntilChanged()
      )
    }

    public loadUrl: string
    public fullConnectivityLoadUrl: string

    ngOnInit(): void {
      this.httpClient.get<[]>(this.connectivityUrl).subscribe(res => {
        this.datasetList = res
        this.selectedDataset = this.datasetList[0].name
        this.selectedDatasetDescription = this.datasetList[0].description

        this.changeDataset()
      })
    }

    public ngAfterViewInit(): void {
      this.subscriptions.push(
        this.store$.pipe(
          select(viewerStateOverwrittenColorMap),
        ).subscribe(value => {
          this.setColorMap$.next(!!value)
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
          if (connectedAreas === 'No data') {
            this.store$.dispatch(
              ngViewerActionClearView({
                payload: {
                  [CONNECTIVITY_NAME_PLATE]: false
                }
              })
            )
            this.connectedAreas = []
            this.noDataReceived = true
            this.connectivityNumberReceived.emit('0')

            return this.restoreDefaultColormap()
          } else {
            this.store$.dispatch(
              ngViewerActionClearView({
                payload: {
                  [CONNECTIVITY_NAME_PLATE]: true
                }
              })
            )
            this.noDataReceived = false

            this.connectivityNumberReceived.emit(connectedAreas.length)
            this.connectedAreas = connectedAreas

            if (flag) {
              this.addNewColorMap()
              this.store$.dispatch({
                type: SET_CONNECTIVITY_VISIBLE,
                payload: 'connectivity',
              })
            } else {
              this.restoreDefaultColormap()

              this.store$.dispatch({type: SET_CONNECTIVITY_VISIBLE, payload: null})

              /**
                         * TODO
                         * may no longer be necessary
                         */
              this.store$.dispatch({type: CLEAR_CONNECTIVITY_REGION})
            }
          }
        })
      )

      this.subscriptions.push(
        fromEvent(this.connectivityComponentElement?.nativeElement, 'collapsedMenuChanged', {capture: true})
          .subscribe((e: CustomEvent) => {
            this.expandMenuIndex = e.detail
          }),
        fromEvent(this.connectivityComponentElement?.nativeElement, 'customToolEvent', {capture: true})
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
      this.restoreDefaultColormap()
      this.subscriptions.forEach(s => s.unsubscribe())
    }

    // ToDo Affect on component
    changeDataset(event = null) {
      if (event) {
        this.selectedDataset = event.value
        this.selectedDatasetDescription = this.datasetList.find(d => d.name === this.selectedDataset).description
      }
      if (this.datasetList.length && this.selectedDataset) {
        const selectedDatasetId = this.datasetList.find(d => d.name === this.selectedDataset).id
        const url = selectedDatasetId ? `${this.connectivityUrl}/${selectedDatasetId}` : null
        this.connectivityLoadUrl.emit(url)
        this.loadUrl = url

        this.fullConnectivityLoadUrl = selectedDatasetId ? `${this.connectivityUrl}/${selectedDatasetId}/full_matrix` : null
      }
    }

    navigateToRegion(region) {
      this.store$.dispatch(
        viewerStateNavigateToRegion({
          payload: {region: this.getRegionWithName(region)}
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
      if (!this.defaultColorMap) return
      getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(this.defaultColorMap)
    }

    public addNewColorMap() {
      if (!this.defaultColorMap) {
        this.defaultColorMap = new Map(getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())
      }

      const existingMap: Map<string, Map<number, { red: number, green: number, blue: number }>> = (getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())
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
          colorMap.get(areaAsRegion[0].ngId).set(areaAsRegion[0].labelIndex, {
            red: area.color.r,
            green: area.color.g,
            blue: area.color.b
          })
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
