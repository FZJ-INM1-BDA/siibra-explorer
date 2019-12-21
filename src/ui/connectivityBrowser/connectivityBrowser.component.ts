import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Observable, Subscription} from "rxjs";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {CLEAR_CONNECTIVITY_REGION, SET_CONNECTIVITY_REGION} from "src/services/state/viewerState.store";
import {HIDE_SIDE_PANEL_CONNECTIVITY, isDefined, safeFilter} from "src/services/stateStore.service";

@Component({
  selector: 'connectivity-browser',
  templateUrl: './connectivityBrowser.template.html',
})
export class ConnectivityBrowserComponent implements AfterViewInit, OnDestroy {

    public region: string
    private connectedAreas = []

    private connectivityRegion$: Observable<any>
    private selectedParcellation$: Observable<any>
    private subscriptions: Subscription[] = []
    public expandMenuIndex = -1
    public allRegions = []
    public defaultColorMap: Map<string, Map<number, {red: number, green: number, blue: number}>>
    public parcellationHasConnectivityData = true
    private areaHemisphere: string

    public math = Math

    @ViewChild('connectivityComponent', {read: ElementRef}) public connectivityComponentElement: ElementRef

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
      )

    }

    public ngAfterViewInit(): void {
      this.subscriptions.push(
        this.selectedParcellation$.subscribe(parcellation => {
          if (parcellation && parcellation.hasAdditionalViewMode && parcellation.hasAdditionalViewMode.includes('connectivity')) {
            this.parcellationHasConnectivityData = true
            if (parcellation.regions && parcellation.regions.length) {
              this.allRegions = []
              this.getAllRegionsFromParcellation(parcellation.regions)
              if (this.defaultColorMap) {
                this.addNewColorMap()
              }
            }
          } else {
            this.parcellationHasConnectivityData = false
          }
        }),
        this.connectivityRegion$.subscribe(cr => {
          this.region = cr
          this.areaHemisphere = cr.includes('left hemisphere') ? ' - left hemisphere' : ' - right hemisphere'
          this.changeDetectionRef.detectChanges()
        }),
      )

      this.subscriptions.push(
        fromEvent(this.connectivityComponentElement.nativeElement, 'connectivityDataReceived', { capture: true })
          .subscribe((e: CustomEvent) => {
            this.connectedAreas = e.detail
            if (this.connectedAreas.length > 0) { this.addNewColorMap() }
          }),
        fromEvent(this.connectivityComponentElement.nativeElement, 'collapsedMenuChanged', { capture: true })
          .subscribe((e: CustomEvent) => {
            this.expandMenuIndex = e.detail
          }),

      )
    }

    public ngOnDestroy(): void {
      this.setDefaultMap()
      this.subscriptions.forEach(s => s.unsubscribe())
    }

    public updateConnevtivityRegion(regionName) {
      this.store$.dispatch({
        type: SET_CONNECTIVITY_REGION,
        connectivityRegion: regionName,
      })
    }

    public closeConnectivityView() {
      this.setDefaultMap()

      this.store$.dispatch({
        type: HIDE_SIDE_PANEL_CONNECTIVITY,
      })
      this.store$.dispatch({
        type: CLEAR_CONNECTIVITY_REGION,
      })
    }

    public setDefaultMap() {
      this.allRegions.forEach(r => {
        if (r && r.ngId && r.rgb) {
          this.defaultColorMap.get(r.ngId).set(r.labelIndex, {red: r.rgb[0], green: r.rgb[1], blue: r.rgb[2]})
        }
      })
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
          .filter(r => r.name === area.name + this.areaHemisphere)
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

}

function getWindow(): any {
  return window
}
