import {
  AfterContentChecked,
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef, EventEmitter, Input,
  OnDestroy, Output,
  ViewChild,
} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Observable, Subscription} from "rxjs";
import {distinctUntilChanged, filter, map, shareReplay} from "rxjs/operators";
import {CLEAR_CONNECTIVITY_REGION, SELECT_REGIONS, SET_CONNECTIVITY_VISIBLE} from "src/services/state/viewerState.store";
import {isDefined, safeFilter} from "src/services/stateStore.service";
import { viewerStateNavigateToRegion } from "src/services/state/viewerState.store.helper";

@Component({
  selector: 'connectivity-browser',
  templateUrl: './connectivityBrowser.template.html',
})
export class ConnectivityBrowserComponent implements AfterViewInit, OnDestroy, AfterContentChecked {

    public region: string
    public datasetList: any[] = []
    public selectedDataset: any
    public connectedAreas = []
    public componentHeight: any
    public showConnectivityToggle: boolean = false

    private connectivityRegion$: Observable<any>
    private templateSelected$: Observable<any>
    private selectedParcellation$: Observable<any>
    public overwrittenColorMap$: Observable<any>

    private subscriptions: Subscription[] = []
    public expandMenuIndex = -1
    public allRegions = []
    public defaultColorMap: Map<string, Map<number, {red: number, green: number, blue: number}>>
    public math = Math

    @ViewChild('connectivityComponent', {read: ElementRef}) public connectivityComponentElement: ElementRef<HTMLHbpConnectivityMatrixRowElement>
    @ViewChild('fullConnectivityGrid') public fullConnectivityGridElement: ElementRef<HTMLFullConnectivityGridElement>

    @Output() public closeConnectivity: EventEmitter<boolean> = new EventEmitter()
    @Output() public connectedAreaCount: EventEmitter<number> = new EventEmitter()

    constructor(
        private store$: Store<any>,
        private changeDetectionRef: ChangeDetectorRef,
    ) {
      this.selectedParcellation$ = this.store$.pipe(
        select('viewerState'),
        filter(state => isDefined(state) && isDefined(state.parcellationSelected)),
        map(state => state.parcellationSelected),
        distinctUntilChanged(),
      )

      this.connectivityRegion$ = this.store$.pipe(
        select('viewerState'),
        safeFilter('connectivityRegion'),
        map(state => state.connectivityRegion),
        distinctUntilChanged()
      )

      this.templateSelected$ = this.store$.pipe(
        select('viewerState'),
        select('templateSelected'),
        shareReplay(1)
      )

      this.overwrittenColorMap$ = this.store$.pipe(
        select('viewerState'),
        safeFilter('overwrittenColorMap'),
        map(state => state.overwrittenColorMap),
        distinctUntilChanged()
      )
    }

    public ngAfterContentChecked(): void {
      this.componentHeight = this.connectivityComponentElement?.nativeElement.clientHeight
    }

    public ngAfterViewInit(): void {
      this.subscriptions.push(
        this.selectedParcellation$.subscribe(parcellation => {
          this.closeConnectivityView(false)
          if (parcellation && parcellation.hasAdditionalViewMode && parcellation.hasAdditionalViewMode.includes('connectivity')) {
            if (parcellation.regions && parcellation.regions.length) {
              this.allRegions = []
              this.getAllRegionsFromParcellation(parcellation.regions)
            }
          }
        }),
        this.connectivityRegion$.subscribe(cr => {
          if (cr && cr.length) {
            if (this.region !== cr && this.defaultColorMap) {
              this.closeConnectivityView()
            }
            this.region = cr
            this.changeDetectionRef.detectChanges()
          } else {
            this.store$.dispatch({
              type: SET_CONNECTIVITY_VISIBLE,
              payload: false,
            })
          }
        }),
      )
      this.subscriptions.push(this.overwrittenColorMap$.subscribe(ocm => {
        this.showConnectivityToggle = ocm === 'connectivity'? true : false
      }))
      this.subscriptions.push(
        fromEvent(this.connectivityComponentElement?.nativeElement, 'connectivityDataReceived', { capture: true })
          .subscribe((e: CustomEvent) => {
            this.connectedAreas = e.detail
            this.connectedAreaCount.emit(this.connectedAreas.length)
            if (this.connectedAreas.length > 0 && this.showConnectivityToggle) {
              this.addNewColorMap()
            } else {
              this.defaultColorMap = new Map(getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())
            }          }),
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
            } else if (e.detail.name === 'Apply colors to viewer') {
              this.defaultColorMap && this.toggleConnectivityOnViewer( {checked: this.showConnectivityToggle? false : true})
            }
          }),
      )
      this.showConnectivityToggle = true
    }

    toggleConnectivityOnViewer(event) {
      if (event.checked) {
        this.showConnectivityToggle = true
        this.addNewColorMap()
      } else {
        this.showConnectivityToggle = false
        if (this.defaultColorMap) this.setDefaultMap()
        this.store$.dispatch({
          type: SET_CONNECTIVITY_VISIBLE,
          payload: null,
        })
      }
    }
    
    // ToDo Affect on component
    changeDataset(event) {
      this.selectedDataset = event.value
    }

    public ngOnDestroy(): void {
      this.subscriptions.forEach(s => s.unsubscribe())
      // this.defaultColorMap && this.setDefaultMap()
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

    public closeConnectivityView(setDefault = true) {
      if (this.defaultColorMap && setDefault) this.setDefaultMap()
      this.closeConnectivity.emit()
      this.store$.dispatch({
        type: SET_CONNECTIVITY_VISIBLE,
        payload: null,
      })
    }

    public setDefaultMap() {
      this.allRegions.forEach(r => {
        if (r && r.ngId && r.rgb && this.defaultColorMap) {
          this.defaultColorMap.get(r.ngId).set(r.labelIndex, {red: r.rgb[0], green: r.rgb[1], blue: r.rgb[2]})
        }
      })
      getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(this.defaultColorMap)
    }

    public addNewColorMap() {
      this.store$.dispatch({
        type: SET_CONNECTIVITY_VISIBLE,
        payload: 'connectivity',
      })
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

    public getAllRegionsFromParcellation = (regions) => {
      for (const region of regions) {
        if (region.children && region.children.length) {
          this.getAllRegionsFromParcellation(region.children)
        } else {
          this.allRegions.push(region)
        }
      }
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
