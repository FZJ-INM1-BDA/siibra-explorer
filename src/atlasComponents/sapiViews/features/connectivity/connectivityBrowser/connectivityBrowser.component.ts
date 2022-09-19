import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, Input, ChangeDetectorRef} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Subscription, BehaviorSubject} from "rxjs";
import {catchError, take} from "rxjs/operators";
import {SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel} from "src/atlasComponents/sapi";
import { atlasAppearance, atlasSelection } from "src/state";
import {PARSE_TYPEDARRAY} from "src/atlasComponents/sapi/sapi.service";
import {SapiModalityModel, SapiParcellationFeatureMatrixModel} from "src/atlasComponents/sapi/type";
import { of } from "rxjs";
import {CustomLayer} from "src/state/atlasAppearance";

@Component({
  selector: 'sxplr-sapiviews-features-connectivity-browser',
  templateUrl: './connectivityBrowser.template.html',
})
export class ConnectivityBrowserComponent implements AfterViewInit, OnDestroy {

    @Input('sxplr-sapiviews-features-connectivity-browser-atlas')
    atlas: SapiAtlasModel

    @Input('sxplr-sapiviews-features-connectivity-browser-parcellation')
    parcellation: SapiParcellationModel

    /**
     * accordion expansion should only toggle the clearviewqueue state
     * which should be the single source of truth
     * setcolormaps$ is set by the presence/absence of clearviewqueue[CONNECTIVITY_NAME_PLATE]
     */
    private _isFirstUpdate = true
    
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

      if (flag) {
        if (this.allRegions.length) {
          this.setCustomLayer()
        } else {
          this.setCustomLayerOnLoad = true
        }
      } else {
        this.removeCustomLayer()
      }

    }

    @Input() types: SapiModalityModel[] = []

    private _defaultProfile
    @Input() set defaultProfile(val: any) {
      this._defaultProfile = val
      this.selectedType = this.types.find(t => t.types.includes(val.type))?.name
      this.pageNumber = 1
      this.selectedDataset = this.fixDatasetFormat(val.selectedDataset)
      if (val.matrix) this.setMatrixData(val.matrix)
      this.numberOfDatasets = val.numberOfDatasets
    }

    get defaultProfile() {
      return this._defaultProfile
    }

    public selectedType: any

    @Input()
    set region(val) {
      const newRegionName = val && val.name

      if (val.status
          && !val.name.includes('left hemisphere')
          && !val.name.includes('right hemisphere')) {
        this.regionHemisphere = val.status
      }

      this.regionName = newRegionName
    }

    public regionName: string
    public regionHemisphere: string = null
    public selectedDataset: any
    public connectionsString: string
    public pureConnections: { [key: string]: number }
    public connectedAreas: BehaviorSubject<ConnectedArea[]> = new BehaviorSubject([])
    public noConnectivityForRegion: boolean
    private subscriptions: Subscription[] = []
    public allRegions = []
    private regionIndexInMatrix = -1
    public defaultColorMap: Map<string, Map<number, { red: number, green: number, blue: number }>>
    public matrixString: string
    public fetching: boolean
    public numberOfDatasets: number
    public connectivityLayerId = 'connectivity-colormap-id'
    private setCustomLayerOnLoad = false
    public pageNumber: number
    private customLayerEnabled: boolean

    public logDisabled: boolean = true
    public logChecked: boolean = true

    @ViewChild('connectivityComponent', {read: ElementRef}) public connectivityComponentElement: ElementRef<any>
    @ViewChild('fullConnectivityGrid') public fullConnectivityGridElement: ElementRef<any>

    constructor(
        private store$: Store,
        private sapi: SAPI,
        private changeDetectionRef: ChangeDetectorRef,
    ) {}

    public ngAfterViewInit(): void {
      this.subscriptions.push(

        this.store$.pipe(
          select(atlasSelection.selectors.selectedParcAllRegions)
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
        fromEvent(this.connectivityComponentElement?.nativeElement, 'customToolEvent', {capture: true})
          .subscribe((e: CustomEvent) => {
            if (e.detail.name === 'export csv') {
              // ToDo Fix in future to use component
              const a = document.querySelector('hbp-connectivity-matrix-row');
              (a as any).downloadCSV()
            }
          }),
        fromEvent(this.connectivityComponentElement?.nativeElement, 'connectedRegionClicked', {capture: true})
          .subscribe((e: CustomEvent) => {
            this.navigateToRegion(this.getRegionWithName(e.detail.name))
          }),
      )
    }

    setCustomLayer() {
      if (this.customLayerEnabled) {
        this.removeCustomLayer()
      }
      const map = new Map<SapiRegionModel, number[]>()
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

    selectType(typeName) {
      this.selectedType = typeName
      this.pageNumber = 1
      this.loadDataset()
    }

    datasetSliderChanged(pageNumber) {
      this.pageNumber = pageNumber
      this.loadDataset()
    }

    loadDataset() {
      this.fetching = true
      const type = this.types.find(t => t.name === this.selectedType).types[0]
      return this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"])
        .getFeatures({type, page: this.pageNumber, size: 1},)
        .pipe(
          take(1),
          catchError(() => {
            this.fetching = false
            return of(null)
          })
        ).subscribe((res: any) => {
          if (res && res.items) {
            if (res.total !== this.numberOfDatasets) {
              this.numberOfDatasets = res.total
            }
            this.selectedDataset = this.fixDatasetFormat(res.items[0])
            this.fetchConnectivity()
          }
        })
    }

    // ToDo this temporary fix is for the bug existing on siibra api https://github.com/FZJ-INM1-BDA/siibra-api/issues/100
    private fixDatasetFormat = (ds) =>  ds.name.includes('{')? ({
      ...ds,
      ...JSON.parse(ds.name.substring(ds.name.indexOf('{')).replace(/'/g, '"'))
    }) : ds

    fetchConnectivity() {
      this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatureInstance(this.selectedDataset['@id'])
        .pipe(catchError(() => {
          this.fetching = false
          return of(null)
        }))
        .subscribe(ds=> {
          this.setMatrixData(ds)
          this.fetching = false
        })
    }

    setMatrixData(data) {
      const matrixData = data as SapiParcellationFeatureMatrixModel
      this.regionIndexInMatrix = (matrixData.columns as Array<string>).findIndex(md => md === this.regionName)
      if (this.regionIndexInMatrix < 0) {
        this.fetching = false
        this.noConnectivityForRegion = true
        this.changeDetectionRef.detectChanges()
        return
      } else if (this.noConnectivityForRegion) {
        this.noConnectivityForRegion = false
      }
      this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY)
        .then(matrix => {
          const regionProfile = matrix.rawArray[this.regionIndexInMatrix]

          const maxStrength = Math.max(...regionProfile)
          this.logChecked = maxStrength > 1
          this.logDisabled = maxStrength <= 1

          const areas = regionProfile.reduce((p, c, i) => ({...p, [matrixData.columns[i]]: c}), {})
          this.pureConnections = areas
          this.connectionsString = JSON.stringify(areas)
          this.connectedAreas.next(this.formatConnections(areas))
          this.setCustomLayer()

          this.matrixString = JSON.stringify(matrixData.columns.map((mc, i) => ([mc, ...matrix.rawArray[i]])))
          this.changeDetectionRef.detectChanges()

        })
    }


    changeLog(checked: boolean) {
      this.logChecked = checked
      this.connectedAreas.next(this.formatConnections(this.pureConnections))
      this.connectivityComponentElement.nativeElement.toggleShowLog()
      this.setCustomLayer()
    }

    //ToDo bestViewPoint is null for the most cases
    navigateToRegion(region: SapiRegionModel) {
      const regionCentroid = this.region.hasAnnotation?.bestViewPoint?.coordinates
      if (regionCentroid)
        this.store$.dispatch(
          atlasSelection.actions.navigateTo({
            navigation: {
              position: regionCentroid.map(v => v.value*1e6),
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

export type ConnectedArea = {
    color: {r: number, g: number, b: number}
    name: string
    numberOfConnections: number
}

