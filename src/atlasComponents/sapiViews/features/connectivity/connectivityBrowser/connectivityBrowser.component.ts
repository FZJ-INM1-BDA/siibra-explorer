import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  Input,
  OnInit, Inject,
} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {fromEvent, Subscription, Subject, combineLatest, BehaviorSubject} from "rxjs";
import {catchError, distinctUntilChanged, map, switchMap, take} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {BS_ENDPOINT} from "src/util/constants";
import {OVERWRITE_SHOW_DATASET_DIALOG_TOKEN} from "src/util/interfaces";
import {SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel} from "src/atlasComponents/sapi";
import { actions } from "src/state/atlasSelection";
import { atlasAppearance, atlasSelection } from "src/state";
import {PARSE_TYPEDARRAY} from "src/atlasComponents/sapi/sapi.service";
import {SapiParcellationFeatureMatrixModel} from "src/atlasComponents/sapi/type";
import { of } from "rxjs";


const CONNECTIVITY_NAME_PLATE = 'Connectivity'

@Component({
  selector: 'sxplr-sapiviews-features-connectivity-browser',
  templateUrl: './connectivityBrowser.template.html',
  providers: [
    {
      provide: OVERWRITE_SHOW_DATASET_DIALOG_TOKEN,
      useValue: null
    }
  ]
})
export class ConnectivityBrowserComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input('sxplr-sapiviews-features-connectivity-browser-atlas')
    atlas: SapiAtlasModel

    @Input('sxplr-sapiviews-features-connectivity-browser-parcellation')
    parcellation: SapiParcellationModel

    private setColorMap$: Subject<boolean> = new Subject()

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
      // // this.store$.dispatch(
      // //   ngViewerActionClearView({
      // //     payload: {
      // //       [CONNECTIVITY_NAME_PLATE]: flag && !this.noDataReceived
      // //     }
      // //   })
      // // )
      this.store$.dispatch({
        type: 'SET_OVERWRITTEN_COLOR_MAP',
        payload: flag? CONNECTIVITY_NAME_PLATE : false,
      })

      // if (flag) {
      //   this.addNewColorMap()
      // } else {
      //   this.restoreDefaultColormap()
      // }
    }

    @Input() types: any[]

    private _defaultProfile
    @Input() set defaultProfile(val: any) {
      this._defaultProfile = val
      this.selectedType = this.types.find(t => t.types.includes(val.type)).name
      this.datasetList = val.datasets.map(d => this.formatDataset(d))
      this.selectDataset(val.selectedDataset, false)
      this.setMatrixData(val.matrix)
      this.fetchedPage = 0
    }

    get defaultProfile() {
      return this._defaultProfile
    }


    public selectedType: any

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

      // if(this.selectedDataset) {
      //   this.fetchConnectivity()
      // }
      // TODO may not be necessary
      this.changeDetectionRef.detectChanges()
    }

    public atlasId: any
    public regionName: string
    public regionHemisphere: string = null
    public datasetList: any[] = []
    public selectedDataset: any
    public selectedDatasetName: any
    public selectedDatasetDescription: string = ''
    public selectedDatasetKgId: string = ''
    public selectedDatasetKgSchema: string = ''
    public connectionsString: string
    public connectedAreas: BehaviorSubject<any[]> = new BehaviorSubject([])

    // TODO this may be incompatible
    private selectedParcellationFlatRegions$ = this.store$.pipe(
      switchMap(atlasSelection.fromRootStore.distinctATP()),
      switchMap(({ atlas, template, parcellation }) => this.sapi.getParcRegions(atlas["@id"], parcellation["@id"], template["@id"]))
    )

    private subscriptions: Subscription[] = []
    public expandMenuIndex = -1
    public allRegions = []
    private regionIndexInMatrix = -1
    public defaultColorMap: Map<string, Map<number, { red: number, green: number, blue: number }>>
    public fetching: boolean = false
    public matrixString: string
    public noDataReceived = false
    public loadingDatasets: boolean
    public fetchedPage = 0
    public datasetPerPage = 20


    @ViewChild('connectivityComponent', {read: ElementRef}) public connectivityComponentElement: ElementRef<any>
    @ViewChild('fullConnectivityGrid') public fullConnectivityGridElement: ElementRef<any>

    constructor(
        private store$: Store<any>,
        private changeDetectionRef: ChangeDetectorRef,
        private httpClient: HttpClient,
        @Inject(BS_ENDPOINT) private siibraApiUrl: string,
        private sapi: SAPI
    ) {}
    
    ngOnInit(): void {
      // this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatures()
      //   .subscribe(res => {
      //     this.datasetList = res
      //       .filter(r => ['siibra/features/connectivity', 'siibra/connectivity'].includes(r.type))
      //       .map((r: any) => ({
      //         ...r,
      //         connectionType: r.name.substring(0, r.name.indexOf('{') - 1),
      //         dataset: JSON.parse(r.name.substring(r.name.indexOf('{')).replace(/'/g, '"'))
      //       }))
      //     this.selectDataset(this.datasetList[0]['@id'])
      //   })
    }

    public ngAfterViewInit(): void {
      // // this.subscriptions.push(
      // //   this.store$.pipe(
      // //     select(atlasAppearance.selectors.getOverwrittenColormap),
      // //   ).subscribe(value => {
      // //     if (this.accordionIsExpanded) {
      // //       this.setColorMap$.next(!!value)
      // //     }
      // //   })
      // // )
      //
      // if (this.accordionIsExpanded) {
      //   this.setColorMap$.next(true)
      // }
      //
      // this.subscriptions.push(
      //   this.selectedParcellationFlatRegions$.subscribe(flattenedRegions => {
      //     this.defaultColorMap = null
      //     this.allRegions = flattenedRegions
      //   }),
      // )
      //
      // /**
      //    * setting/restoring colormap
      //    */
      // this.subscriptions.push(
      //   combineLatest([
      //     this.setColorMap$.pipe(
      //       distinctUntilChanged()
      //     ),
      //     // fromEvent(this.connectivityComponentElement?.nativeElement, 'connectivityDataReceived').pipe(
      //     //   map((e: CustomEvent) => {
      //     //     // if (e.detail !== 'No data') {
      //     //     //   this.connectivityNumberReceived.emit(e.detail.length)
      //     //     // }
      //     //     return e.detail
      //     //   })
      //     // )
      //     this.connectedAreas
      //   ]).subscribe(([flag, connectedAreas]) => {
      //
      //     if (connectedAreas.length === 0) {
      //       this.noDataReceived = true
      //       return this.clearViewer()
      //     } else {
      //       // this.store$.dispatch(
      //       //   ngViewerActionClearView({
      //       //     payload: {
      //       //       [CONNECTIVITY_NAME_PLATE]: true
      //       //     }
      //       //   })
      //       // )
      //       this.noDataReceived = false
      //
      //       if (flag) {
      //         this.addNewColorMap()
      //         this.store$.dispatch({
      //           type: 'SET_OVERWRITTEN_COLOR_MAP',
      //           payload: 'connectivity',
      //         })
      //       } else {
      //         this.restoreDefaultColormap()
      //
      //         this.store$.dispatch({type: 'SET_OVERWRITTEN_COLOR_MAP', payload: null})
      //
      //       }
      //     }
      //   })
      // )

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

    selectType(typeName) {
      this.selectedType = typeName
      this.fetchedPage=-1
      this.loadMoreDatasets(0)
    }

    loadMoreDatasets(selectId = -1) {
      this.loadingDatasets = true
      this.fetchedPage += 1
      const type = this.types.find(t => t.name === this.selectedType).types[0]
      return this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"])
        .getFeatures({page: this.fetchedPage, perPage: 20}, type)
        .pipe(
          take(1),
          catchError(() => {
            return of(null)
          })
        ).subscribe((datasets: any[]) => {
          if (datasets && datasets.length) {
            datasets.forEach(d => this.datasetList.push(this.formatDataset(d)))

            //  Select dataset if we have selectId
            if (selectId >= 0 && selectId < datasets.length) {
              this.selectDataset(datasets[selectId])
            }
          }
          this.loadingDatasets = false
        })
    }

    selectDataset(datasetId, fetchConnectivity=true) {
      const dataset = this.datasetList.find(d => d['@id'] === datasetId)
      this.selectedDataset = dataset['@id']
      this.selectedDatasetName = dataset.data.name
      this.selectedDatasetDescription = dataset.data.description
      this.selectedDatasetKgId = dataset.data['dataset_id']

      if (fetchConnectivity) {
        this.fetchConnectivity()
      }
    }
    
    private formatDataset = (ds) => ({
      ...ds,
      data: JSON.parse(ds.name.substring(ds.name.indexOf('{')).replace(/'/g, '"'))
    })
    

    fetchConnectivity() {
      this.fetching = true
      this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatureInstance(this.selectedDataset)
        .pipe(catchError((err) => {
          this.fetching = false
          return of(null)
        }))
        .subscribe(ds=> {
          this.setMatrixData(ds)  
          this.fetching = false
          this.changeDetectionRef.detectChanges()
        })
    }
    
    setMatrixData(data) {
      const matrixData = data as SapiParcellationFeatureMatrixModel
      this.regionIndexInMatrix = (matrixData.columns as Array<string>).findIndex(md => md === this.regionName)
      this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY)
        .then(matrix => {
          const areas = {}
          matrix.rawArray[this.regionIndexInMatrix].forEach((value, i) => {
            areas[matrixData.columns[i]] = value
          })
          this.connectionsString = JSON.stringify(areas)
          this.connectedAreas.next(this.cleanConnectedAreas(areas))

          this.matrixString = JSON.stringify(matrixData.columns.map((mc, i) => ([mc, ...matrix.rawArray[i]])))
        })
    }

    clearViewer() {
      // this.store$.dispatch(
      //   ngViewerActionClearView({
      //     payload: {
      //       [CONNECTIVITY_NAME_PLATE]: false
      //     }
      //   })
      // )
      this.connectedAreas.next([])

      // return this.restoreDefaultColormap()
    }

    //ToDo navigateRegion action does not work any more
    navigateToRegion(region: SapiRegionModel) {
      this.store$.dispatch(
        atlasSelection.actions.navigateToRegion({
          region
        })
      )
    }

    getRegionWithName(region) {
      return this.allRegions.find(r => r.name === region)
    }

    public restoreDefaultColormap() {
      if (!this.defaultColorMap) return
      getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(this.defaultColorMap)
    }

    public addNewColorMap() {
      if (!this.defaultColorMap) {
        this.defaultColorMap = getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap()
      }

      const existingMap: Map<string, Map<number, { red: number, green: number, blue: number }>> = (getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())
      const colorMap = new Map(existingMap)

      this.allRegions.forEach(r => {
        if (r.ngId) {
          colorMap.get(r.ngId).set(r.labelIndex, {red: 255, green: 255, blue: 255})
        }
      })

      this.connectedAreas.value.forEach(area => {
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
      const a = document.querySelector('hbp-connectivity-matrix-row');
      (a as any).downloadCSV()
    }

    public exportFullConnectivity() {
      this.fullConnectivityGridElement?.nativeElement['downloadCSV']()
    }


    public ngOnDestroy(): void {
      // this.store$.dispatch(
      //   ngViewerActionClearView({
      //     payload: {
      //       [CONNECTIVITY_NAME_PLATE]: false
      //     }
      //   })
      // )
      this.restoreDefaultColormap()
      this.subscriptions.forEach(s => s.unsubscribe())
    }


    private floatConnectionNumbers

    cleanConnectedAreas = (areas) => {
      const cleanedObj = Object.keys(areas)
        .map(key => ({name: key, numberOfConnections: areas[key]}))
        .filter(f => f.numberOfConnections > 0)
        .sort((a, b) => +b.numberOfConnections - +a.numberOfConnections)

      this.floatConnectionNumbers = cleanedObj[0].numberOfConnections <= 1
      const logMax = this.floatConnectionNumbers ? cleanedObj[0].numberOfConnections : Math.log(cleanedObj[0].numberOfConnections)
      const colorAreas = []

      cleanedObj.forEach((a, i) => {
        if (a.name.includes(' - both hemispheres')) {

          const rightTitle = a.name.replace(' - both hemispheres', ' - right hemisphere')
          const rightHemisphereItemToAdd = {...a, name: rightTitle}
          cleanedObj.splice(i + 1, 0, rightHemisphereItemToAdd)

          cleanedObj[i] = {
            ...cleanedObj[i],
            name: cleanedObj[i].name.replace(' - both hemispheres', ' - left hemisphere')
          }
        }
      })
      cleanedObj.forEach((a) => {
        colorAreas.push({
          ...a,
          color: {
            r: this.colormap_red(this.floatConnectionNumbers ? a.numberOfConnections : Math.log(a.numberOfConnections) / logMax),
            g: this.colormap_green(this.floatConnectionNumbers ? a.numberOfConnections : Math.log(a.numberOfConnections) / logMax),
            b: this.colormap_blue(this.floatConnectionNumbers ? a.numberOfConnections : Math.log(a.numberOfConnections) / logMax)
          }
        })
      })
      return colorAreas
    }

    clamp = val => Math.round(Math.max(0, Math.min(1.0, val)) * 255)

    colormap_red = (x) => {
      if (x < 0.7) {
        return this.clamp(4.0 * x - 1.5);
      } else {
        return this.clamp(-4.0 * x + 4.5);
      }
    }

    colormap_green = (x) => {
      if (x < 0.5) {
        return this.clamp(4.0 * x - 0.5);
      } else {
        return this.clamp(-4.0 * x + 3.5);
      }
    }

    colormap_blue = (x) => {
      if (x < 0.3) {
        return this.clamp(4.0 * x + 0.5);
      } else {
        return this.clamp(-4.0 * x + 2.5);
      }
    }
    
    

}

function getWindow(): any {
  return window
}
