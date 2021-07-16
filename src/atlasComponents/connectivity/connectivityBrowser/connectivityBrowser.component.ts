import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  Input,
  OnInit, Inject,
} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Observable, Subscription, Subject, combineLatest} from "rxjs";
import {distinctUntilChanged, filter, map} from "rxjs/operators";

import { viewerStateNavigateToRegion, viewerStateSetSelectedRegions } from "src/services/state/viewerState.store.helper";
import { ngViewerSelectorClearViewEntries, ngViewerActionClearView } from "src/services/state/ngViewerState.store.helper";
import {
  viewerStateAllRegionsFlattenedRegionSelector,
  viewerStateOverwrittenColorMapSelector
} from "src/services/state/viewerState/selectors";
import {HttpClient} from "@angular/common/http";
import {BS_ENDPOINT} from "src/util/constants";
import {getIdFromKgIdObj} from "common/util";


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

    public connectivityUrl: string

    private accordionIsExpanded = false

    @Input()
    set accordionExpanded(flag: boolean) {
      /**
         * ignore first update
         */
      if (this._isFirstUpdate) {
        this._isFirstUpdate = false
        return
      }
      this.accordionIsExpanded = flag
      this.store$.dispatch(
        ngViewerActionClearView({
          payload: {
            [CONNECTIVITY_NAME_PLATE]: flag && !this.noDataReceived
          }
        })
      )
      this.store$.dispatch({
        type: 'SET_OVERWRITTEN_COLOR_MAP',
        payload: flag? CONNECTIVITY_NAME_PLATE : false,
      })
    }

    @Output()
    connectivityDataReceived = new EventEmitter<any>()

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
          type: 'SET_OVERWRITTEN_COLOR_MAP',
          payload: false,
        })
        return
      }

      if (newRegionName !== this.regionName && this.defaultColorMap) {
        this.restoreDefaultColormap()
      }

      if (val.status
          && !val.name.includes('left hemisphere')
          && !val.name.includes('right hemisphere')) {
        this.regionHemisphere = val.status
      }

      this.regionName = newRegionName
      this.regionId = val.id? val.id.kg? getIdFromKgIdObj(val.id.kg) : val.id : null
      this.atlasId = val.context.atlas['@id']
      this.parcellationId = val.context.parcellation['@id']

      if(this.selectedDataset) {
        this.setConnectivityUrl()
        this.setProfileLoadUrl()
      }

      // TODO may not be necessary
      this.changeDetectionRef.detectChanges()
    }
    public atlasId: any
    public parcellationId: any
    public regionId: string
    public regionName: string
    public regionHemisphere: string = null
    public datasetList: any[] = []
    public selectedDataset: any
    public selectedDatasetDescription: string = ''
    public selectedDatasetKgId: string = ''
    public selectedDatasetKgSchema: string = ''
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
        private httpClient: HttpClient,
        @Inject(BS_ENDPOINT) private siibraApiUrl: string,
    ) {

      this.overwrittenColorMap$ = this.store$.pipe(
        select(viewerStateOverwrittenColorMapSelector),
        distinctUntilChanged()
      )
    }

    public loadUrl: string
    public fullConnectivityLoadUrl: string

    ngOnInit(): void {
      this.setConnectivityUrl()

      this.httpClient.get<[]>(this.connectivityUrl).subscribe(res => {
        this.datasetList = res
        this.selectedDataset = this.datasetList[0]?.['@id']
        this.selectedDatasetDescription = this.datasetList[0]?.['src_info']

        this.changeDataset()
      })
    }

    public ngAfterViewInit(): void {
      this.subscriptions.push(
        this.store$.pipe(
          select(viewerStateOverwrittenColorMapSelector),
        ).subscribe(value => {
          if (this.accordionIsExpanded) {
            this.setColorMap$.next(!!value)
          }
        })
      )

      /**
       * Listen to of clear view entries
       * can come from within the component (when connectivity is not available for the dataset)
       * --> do not collapse
       * or outside (user clicks x in chip)
       * --> collapse
       */
      this.subscriptions.push(
        this.store$.pipe(
          select(ngViewerSelectorClearViewEntries),
          map(arr => arr.filter(v => v === CONNECTIVITY_NAME_PLATE)),
          filter(arr => arr.length ===0),
          distinctUntilChanged()
        ).subscribe(() => {
          if (!this.noDataReceived) {
            this.setOpenState.emit(false)
          }
        })
      )


      this.subscriptions.push(this.overwrittenColorMap$.subscribe(ocm => {
        if (this.accordionIsExpanded && !ocm) {
          this.setOpenState.emit(false)
        }
      }))

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
          fromEvent(this.connectivityComponentElement?.nativeElement, 'connectivityDataReceived').pipe(
            map((e: CustomEvent) => {
              if (e.detail !== 'No data') {
                this.connectivityNumberReceived.emit(e.detail.length)
              }
              return e.detail
            })
          )
        ).subscribe(([flag, connectedAreas]) => {
          if (connectedAreas === 'No data') {
            this.noDataReceived = true
            return this.clearViewer()
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
                type: 'SET_OVERWRITTEN_COLOR_MAP',
                payload: 'connectivity',
              })
            } else {
              this.restoreDefaultColormap()

              this.store$.dispatch({type: 'SET_OVERWRITTEN_COLOR_MAP', payload: null})

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
      this.connectivityNumberReceived.emit(null)
      this.store$.dispatch(
        ngViewerActionClearView({
          payload: {
            [CONNECTIVITY_NAME_PLATE]: false
          }
        })
      )
      this.restoreDefaultColormap()
      this.subscriptions.forEach(s => s.unsubscribe())
    }

    private setConnectivityUrl() {
      this.connectivityUrl = `${this.siibraApiUrl}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.parcellationId)}/regions/${encodeURIComponent(this.regionId || this.regionName)}/features/ConnectivityProfile`
    }

    private setProfileLoadUrl() {
      const url = `${this.connectivityUrl}/${encodeURIComponent(this.selectedDataset)}`
      this.connectivityLoadUrl.emit(url)
      this.loadUrl = url
    }

    clearViewer() {
      this.store$.dispatch(
        ngViewerActionClearView({
          payload: {
            [CONNECTIVITY_NAME_PLATE]: false
          }
        })
      )
      this.connectedAreas = []
      this.connectivityNumberReceived.emit('0')

      return this.restoreDefaultColormap()
    }

    // ToDo Affect on component
    changeDataset(event = null) {
      if (event) {
        this.selectedDataset = event.value
        const foundDataset = this.datasetList.find(d => d['@id'] === this.selectedDataset)
        this.selectedDatasetDescription = foundDataset?.['src_info']
        this.selectedDatasetKgId = foundDataset?.kgId || null
        this.selectedDatasetKgSchema = foundDataset?.kgschema || null
      }
      if (this.datasetList.length && this.selectedDataset) {
        this.setProfileLoadUrl()

        this.fullConnectivityLoadUrl = `${this.siibraApiUrl}/atlases/${encodeURIComponent(this.atlasId)}/parcellations/${encodeURIComponent(this.parcellationId)}/features/ConnectivityMatrix/${encodeURIComponent(this.selectedDataset)}`
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
      this.store$.dispatch(
        viewerStateSetSelectedRegions({
          selectRegions: [ region ]
        })
      )
    }

    getRegionWithName(region) {
      return this.allRegions.find(ar => {
        if (this.regionHemisphere) {
          let regionName = region
          let regionStatus = null
          if (regionName.includes('left hemisphere')) {
            regionStatus = 'left hemisphere'
            regionName = regionName.replace(' - left hemisphere', '');
          } else if (regionName.includes('right hemisphere')) {
            regionStatus = 'right hemisphere'
            regionName = regionName.replace(' - right hemisphere', '');
          }
          return ar.name === regionName && ar.status === regionStatus
        }

        return ar.name === region
      })
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
          .filter(r => {

            if (this.regionHemisphere) {
              let regionName = area.name
              let regionStatus = null
              if (regionName.includes('left hemisphere')) {
                regionStatus = 'left hemisphere'
                regionName = regionName.replace(' - left hemisphere', '');
              } else if (regionName.includes('right hemisphere')) {
                regionStatus = 'right hemisphere'
                regionName = regionName.replace(' - right hemisphere', '');
              }
              return r.name === regionName && r.status === regionStatus
            }

            return r.name === area.name
          })
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
      this.fullConnectivityGridElement?.nativeElement['downloadCSV']()
    }

}

function getWindow(): any {
  return window
}
