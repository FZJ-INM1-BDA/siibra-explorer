import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, Input, ChangeDetectorRef} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Subscription, BehaviorSubject, Observable} from "rxjs";
import {catchError, take} from "rxjs/operators";

import { atlasAppearance } from "src/state";
import {SAPI} from "src/atlasComponents/sapi/sapi.service";
import { of } from "rxjs";
import {CustomLayer} from "src/state/atlasAppearance";
import { HttpClient } from "@angular/common/http";
import { SxplrAtlas, SxplrParcellation, SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { actions, selectors } from "src/state/atlasSelection";

@Component({
  selector: 'sxplr-features-connectivity-browser',
  templateUrl: './connectivityBrowser.template.html',
  styleUrls: ['./connectivityBrowser.style.scss']
})
export class ConnectivityBrowserComponent implements AfterViewInit, OnDestroy {


    @Input('sxplr-features-connectivity-browser-atlas')
    atlas: SxplrAtlas

    @Input('sxplr-features-connectivity-browser-parcellation')
    parcellation: SxplrParcellation

    /**
     * accordion expansion should only toggle the clearviewqueue state
     * which should be the single source of truth
     * setcolormaps$ is set by the presence/absence of clearviewqueue[CONNECTIVITY_NAME_PLATE]
     */
    private _isFirstUpdate = true
    @Input()
    set accordionExpanded(flag: boolean) {
      /**
         * ignore first update
         */
      if (this._isFirstUpdate) {
        this._isFirstUpdate = false
        return
      }

      if (this.types.length && !this.selectedType) this.selectType(this._types[0])

      if (flag) {
        if (this.selectedSubjectIndex >= 0 && this.allRegions.length) {
          this.setCustomLayer()
        } else {
          this.setCustomLayerOnLoad = true
        }
      } else {
        this.removeCustomLayer()
      }

    }
    
    private _region: SxplrRegion
    @Input()
    set region(region) {
      this._region = region
      this.regionName = region.name
    }

    get region() {
      return this._region
    }

    
    private _types: any[] = []
    @Input()
    set types(val) {
      this._types = val.map(t => ({...t, shortName: t.name.split('.').pop()}))
    }
    get types() {
      return this._types
    }


    public selectedType: any
    public selectedCohort: string

    public cohortDatasets: any[]

    public selectedSubjectIndex = null
    public selectedCohortDatasetIndex: any
    public selectedCohortSubjects: any
    public fetchedItems: any[] = []
    public cohorts: string[]
    public selectedView: 'subject' | 'average' | null
    public averageDisabled: boolean = true
    public subjectsDisabled: boolean = true

    public regionName: string

    public selectedDataset: any
    public connectionsString: string
    public pureConnections: { [key: string]: number }
    public connectedAreas: BehaviorSubject<ConnectedArea[]> = new BehaviorSubject([])
    public noConnectivityForRegion: boolean
    private subscriptions: Subscription[] = []
    public allRegions: SxplrRegion[] = []
    private regionIndexInMatrix = -1
    public defaultColorMap: Map<string, Map<number, { red: number, green: number, blue: number }>>
    public matrixString: string
    public fetchingPreData: boolean
    public fetching: boolean
    public connectivityLayerId = 'connectivity-colormap-id'
    private setCustomLayerOnLoad = false
    private customLayerEnabled: boolean

    public logDisabled: boolean = true
    public logChecked: boolean = true

    private endpoint: string


    @ViewChild('connectivityComponent') public connectivityComponentElement: ElementRef<any>
    @ViewChild('fullConnectivityGrid') public fullConnectivityGridElement: ElementRef<any>

    constructor(
        private store$: Store,
        private http: HttpClient,
        private changeDetectionRef: ChangeDetectorRef,
    ) {
      SAPI.BsEndpoint$.pipe(take(1)).subscribe(en => this.endpoint = `${en}/feature/RegionalConnectivity`)
    }

    public ngAfterViewInit(): void {
      this.subscriptions.push(

        this.store$.pipe(
          select(selectors.selectedParcAllRegions)
        ).subscribe(flattenedRegions => {
          this.defaultColorMap = null
          this.allRegions = flattenedRegions
          if (this.setCustomLayerOnLoad) {
            this.setCustomLayer()
            this.setCustomLayerOnLoad = false
          }
        }),
      )

      this.subscriptions.push(
        fromEvent(this.connectivityComponentElement.nativeElement, 'customToolEvent', {capture: true})
          .subscribe((e: CustomEvent) => {
            if (e.detail.name === 'export csv') {
              // ToDo Fix in future to use component
              const a = document.querySelector('hbp-connectivity-matrix-row');
              (a as any).downloadCSV()
            }
          }),
        fromEvent(this.connectivityComponentElement.nativeElement, 'connectedRegionClicked', {capture: true})
          .subscribe((e: CustomEvent) => {
            this.navigateToRegion(this.getRegionWithName(e.detail.name))
          }),
      )
    }

    setCustomLayer() {
      if (this.customLayerEnabled) {
        this.removeCustomLayer()
      }
      const map = new Map<SxplrRegion, number[]>()
      const areas = this.connectedAreas.value
      for (const region of this.allRegions) {
        const area = areas.find(a => a.name === region.name)
        if (area) {
          map.set(region, Object.values(area.color))
        } else {
          map.set(region, [255,255,255,0.1])
        }
      }
      this.customLayerEnabled = true
      const customLayer: CustomLayer = {
        clType: 'customlayer/colormap',
        id: this.connectivityLayerId,
        colormap: map
      }

      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayer({customLayer})
      )
    }

    removeCustomLayer() {
      this.store$.dispatch(
        atlasAppearance.actions.removeCustomLayer({
          id: this.connectivityLayerId
        })
      )
    }

    clearCohortSelection() {
      this.fetchedItems = []
      this.selectedCohort = null
      this.cohorts = []
      this.selectedCohort = null
      this.selectedCohortDatasetIndex = null
      this.selectedCohortSubjects = null

      this.selectedSubjectIndex = null
    }

    selectType(type) {
      this.clearCohortSelection()
      this.selectedType = type
      this.removeCustomLayer()
      this.getModality()
    }


    getModality() {
      this.fetchingPreData = true
      this.fetchModality().subscribe((res: any) => {

        this.fetchedItems.push(...res.items)
        
        this.cohorts = [...new Set(this.fetchedItems.map(item => item.cohort))]
        this.fetchingPreData = false
        this.changeDetectionRef.detectChanges()
        this.selectCohort(this.cohorts[0])
      
      })
    }

    public fetchModality = (): Observable<any> => {
      const url = `${this.endpoint}?parcellation_id=${encodeURIComponent(this.parcellation.id)}&type=${encodeURIComponent(this.selectedType.shortName)}`
      return this.http.get(url)
    }

    selectCohort(cohort: string) {
      this.selectedCohort = cohort
      this.averageDisabled = !this.fetchedItems.find(s => s.cohort === this.selectedCohort && !s.subjects.length)
      this.subjectsDisabled = !this.fetchedItems.find(s => s.cohort === this.selectedCohort && s.subjects.length > 0)
      this.selectedView = !this.averageDisabled? 'average' : 'subject'

      this.cohortDatasets = this.fetchedItems.filter(i => this.selectedCohort === i.cohort)
      
      this.selectedCohortDatasetChanged(0)
    }

    selectedCohortDatasetChanged(index) {
      this.selectedCohortDatasetIndex = index
      this.selectedCohortSubjects = this.cohortDatasets[index].subjects

      this.selectedDataset = this.cohortDatasets[index].datasets[0]

      
      const keepSubject = this.selectedSubjectIndex >= 0 && this.cohortDatasets[this.selectedCohortDatasetIndex].subjects
        .includes(this.selectedCohortSubjects[this.selectedSubjectIndex])

      this.subjectSliderChanged(keepSubject? this.selectedSubjectIndex : 0)
    }

    subjectSliderChanged(index: number) {
      this.selectedSubjectIndex = index
      this.fetchConnectivity()
    }

    fetchConnectivity() {
      const subject = this.selectedCohortSubjects[this.selectedSubjectIndex]
      const dataset = this.cohortDatasets[this.selectedCohortDatasetIndex]

      this.fetching = true
      const url = `${this.endpoint}/${dataset.id}?parcellation_id=${this.parcellation.id}&subject=${subject}&type=${this.selectedType.shortName}`

      this.http.get(url).pipe(catchError(() => {
        this.fetching = false
        return of(null)
      })).subscribe(ds => {
        this.fetching = false
        this.setMatrixData(ds.matrices[subject])
      })
    }

    setMatrixData(data) {
      this.regionIndexInMatrix = data.columns.findIndex(re => this.region.id === re['@id'])

      if (this.regionIndexInMatrix < 0) {
        this.noConnectivityForRegion = true
        this.changeDetectionRef.detectChanges()
        return
      } else if (this.noConnectivityForRegion) {
        this.noConnectivityForRegion = false
      }

      const regionProfile = data.data[this.regionIndexInMatrix]

      const maxStrength = Math.max(...regionProfile)

      this.logChecked = maxStrength > 1
      this.logDisabled = maxStrength <= 1
      const areas = regionProfile.reduce((p, c, i) => {
        return {
          ...p,
          [data.columns[i].name]: c
        }
      }, {})

      this.pureConnections = areas
      this.connectionsString = JSON.stringify(areas)
      this.connectedAreas.next(this.formatConnections(areas))

      this.setCustomLayer()
      this.matrixString = JSON.stringify(data.columns.map((mc, i) => ([mc.name, ...data.data[i]])))
      this.changeDetectionRef.detectChanges()

        
      return data
    }


    changeLog(checked: boolean) {
      this.logChecked = checked
      this.connectedAreas.next(this.formatConnections(this.pureConnections))
      this.connectivityComponentElement.nativeElement.toggleShowLog()
      this.setCustomLayer()
    }

    //ToDo bestViewPoint is null for the most cases
    navigateToRegion(region: SxplrRegion) {
      const regionCentroid = region.centroid
      if (regionCentroid)
        this.store$.dispatch(
          actions.navigateTo({
            navigation: {
              position: regionCentroid.loc.map(v => v*1e6),
            },
            animation: true
          })
        )
    }

    getRegionWithName(region: string) {
      return this.allRegions.find(r => r.name === region)
    }

    exportConnectivityProfile() {
      const a = document.querySelector('hbp-connectivity-matrix-row');
      (a as any).downloadCSV()
    }

    public exportFullConnectivity() {
      this.fullConnectivityGridElement?.nativeElement['downloadCSV']()
    }

    public ngOnDestroy(): void {
      this.removeCustomLayer()
      this.subscriptions.forEach(s => s.unsubscribe())
    }

    private formatConnections(areas: { [key: string]: number }) {
      const cleanedObj = Object.keys(areas)
        .map(key => ({name: key, numberOfConnections: areas[key]}))
        .filter(f => f.numberOfConnections > 0)
        .sort((a, b) => +b.numberOfConnections - +a.numberOfConnections)

      const logMax = this.logChecked ? Math.log(cleanedObj[0].numberOfConnections) : cleanedObj[0].numberOfConnections
      const colorAreas = []

      cleanedObj.forEach((a) => {
        colorAreas.push({
          ...a,
          color: {
            r: this.colormap_red((this.logChecked ? Math.log(a.numberOfConnections) : a.numberOfConnections) / logMax ),
            g: this.colormap_green((this.logChecked ? Math.log(a.numberOfConnections) : a.numberOfConnections) / logMax ),
            b: this.colormap_blue((this.logChecked ? Math.log(a.numberOfConnections) : a.numberOfConnections) / logMax )
          },
        })
      })
      return colorAreas
    }
    private clamp = val => Math.round(Math.max(0, Math.min(1.0, val)) * 255)
    private colormap_red = x => x < 0.7? this.clamp(4.0 * x - 1.5) : this.clamp(-4.0 * x + 4.5)
    private colormap_green = x => x < 0.5? this.clamp(4.0 * x - 0.5) : this.clamp(-4.0 * x + 3.5)
    private colormap_blue = x => x < 0.3? this.clamp(4.0 * x + 0.5) : this.clamp(-4.0 * x + 2.5)

}

type ConnectedArea = {
    color: {r: number, g: number, b: number}
    name: string
    numberOfConnections: number
}
