import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, Output, EventEmitter } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, fromEvent, merge, Observable, of, Subscription, timer } from "rxjs";
import { pipeFromArray } from "rxjs/internal/util/pipe";
import {
  buffer,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  scan,
  shareReplay,
  skip,
  startWith,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
  tap,
  withLatestFrom,
  delayWhen,
} from "rxjs/operators";
import { LoggingService } from "src/logging";
import { FOUR_PANEL, H_ONE_THREE, NG_VIEWER_ACTION_TYPES, SINGLE_PANEL, V_ONE_THREE } from "src/services/state/ngViewerState.store";
import { SELECT_REGIONS_WITH_ID, VIEWERSTATE_ACTION_TYPES } from "src/services/state/viewerState.store";
import { ADD_NG_LAYER, generateLabelIndexId, getMultiNgIdsRegionsLabelIndexMap, getNgIds, ILandmark, IOtherLandmarkGeometry, IPlaneLandmarkGeometry, IPointLandmarkGeometry, isDefined, MOUSE_OVER_LANDMARK, NgViewerStateInterface, REMOVE_NG_LAYER, safeFilter, ViewerStateInterface } from "src/services/stateStore.service";
import { getExportNehuba, isSame } from "src/util/fn";
import { AtlasViewerAPIServices, IUserLandmark } from "../../atlasViewer/atlasViewer.apiService.service";
import { AtlasViewerConstantsServices } from "../../atlasViewer/atlasViewer.constantService.service";
import { computeDistance, NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { getFourPanel, getHorizontalOneThree, getSinglePanel, getVerticalOneThree, calculateSliceZoomFactor } from "./util";
import { NehubaViewerContainerDirective } from "./nehubaViewerInterface/nehubaViewerInterface.directive";

const isFirstRow = (cell: HTMLElement) => {
  const { parentElement: row } = cell
  const { parentElement: container } = row
  return container.firstElementChild === row
}

const isFirstCell = (cell: HTMLElement) => {
  const { parentElement: row } = cell
  return row.firstElementChild === cell
}

const scanFn: (acc: [boolean, boolean, boolean], curr: CustomEvent) => [boolean, boolean, boolean] = (acc, curr) => {

  const target = curr.target as HTMLElement
  const targetIsFirstRow = isFirstRow(target)
  const targetIsFirstCell = isFirstCell(target)
  const idx = targetIsFirstRow
    ? targetIsFirstCell
      ? 0
      : 1
    : targetIsFirstCell
      ? 2
      : null

  const returnAcc = [...acc]
  const num1 = typeof curr.detail.missingChunks === 'number' ? curr.detail.missingChunks : 0
  const num2 = typeof curr.detail.missingImageChunks === 'number' ? curr.detail.missingImageChunks : 0
  returnAcc[idx] = Math.max(num1, num2) > 0
  return returnAcc as [boolean, boolean, boolean]
}

@Component({
  selector : 'ui-nehuba-container',
  templateUrl : './nehubaContainer.template.html',
  styleUrls : [
    `./nehubaContainer.style.css`,
  ],
})

export class NehubaContainer implements OnInit, OnChanges, OnDestroy {

  @ViewChild(NehubaViewerContainerDirective,{static: true})
  public nehubaContainerDirective: NehubaViewerContainerDirective

  @Output()
  public nehubaViewerLoaded: EventEmitter<boolean> = new EventEmitter()

  public handleViewerLoadedEvent(flag: boolean){
    this.viewerLoaded = flag
    this.nehubaViewerLoaded.emit(flag)
  }

  public viewerLoaded: boolean = false

  private sliceViewLoadingMain$: Observable<[boolean, boolean, boolean]>
  public sliceViewLoading0$: Observable<boolean>
  public sliceViewLoading1$: Observable<boolean>
  public sliceViewLoading2$: Observable<boolean>
  public perspectiveViewLoading$: Observable<string|null>

  private templateSelected$: Observable<any>
  private newViewer$: Observable<any>
  private selectedParcellation$: Observable<any>
  private selectedRegions$: Observable<any[]>
  public selectedLandmarks$: Observable<any[]>
  public selectedPtLandmarks$: Observable<any[]>
  private hideSegmentations$: Observable<boolean>

  private fetchedSpatialDatasets$: Observable<ILandmark[]>
  private userLandmarks$: Observable<IUserLandmark[]>

  public onHoverSegment$: Observable<any>

  @Input()
  private currentOnHover: {segments: any, landmark: any, userLandmark: any}

  @Input()
  private currentOnHoverObs$: Observable<{segments: any, landmark: any, userLandmark: any}>

  public onHoverSegments$: Observable<any[]>

  public spatialResultsVisible$: Observable<boolean>
  private spatialResultsVisible: boolean = false

  private selectedTemplate: any | null
  private selectedRegionIndexSet: Set<string> = new Set()
  public fetchedSpatialData: ILandmark[] = []

  private ngLayersRegister: Partial<NgViewerStateInterface> = {layers : [], forceShowSegment: null}
  private ngLayers$: Observable<NgViewerStateInterface>

  public selectedParcellation: any | null

  public nehubaViewer: NehubaViewerUnit
  private multiNgIdsRegionsLabelIndexMap: Map<string, Map<number, any>> = new Map()
  private landmarksLabelIndexMap: Map<number, any> = new Map()
  private landmarksNameMap: Map<string, number> = new Map()

  private subscriptions: Subscription[] = []

  public nanometersToOffsetPixelsFn: Array<(...arg) => any> = []

  private viewPanels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement] = [null, null, null, null]
  public panelMode$: Observable<string>

  private panelOrder: string
  public panelOrder$: Observable<string>
  private redrawLayout$: Observable<[string, string]>

  public hoveredPanelIndices$: Observable<number>

  private ngPanelTouchMove$: Observable<any>

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private apiService: AtlasViewerAPIServices,
    private store: Store<ViewerStateInterface>,
    private elementRef: ElementRef,
    private log: LoggingService,
    private cdr: ChangeDetectorRef
  ) {

    this.useMobileUI$ = this.constantService.useMobileUI$

    this.panelMode$ = this.store.pipe(
      select('ngViewerState'),
      select('panelMode'),
      distinctUntilChanged(),
      shareReplay(1),
    )

    this.panelOrder$ = this.store.pipe(
      select('ngViewerState'),
      select('panelOrder'),
      distinctUntilChanged(),
      shareReplay(1),
      tap(panelOrder => this.panelOrder = panelOrder),
    )

    this.redrawLayout$ = this.store.pipe(
      select('ngViewerState'),
      select('nehubaReady'),
      distinctUntilChanged(),
      filter(v => !!v),
      switchMapTo(combineLatest(
        this.panelMode$,
        this.panelOrder$,
      )),
    )

    this.templateSelected$ = this.store.pipe(
      select('viewerState'),
      select('templateSelected'),
      distinctUntilChanged(isSame),
    )

    this.newViewer$ = this.templateSelected$.pipe(
      filter(v => !!v),
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state => state.parcellationSelected),
      distinctUntilChanged(),
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      select('regionsSelected'),
      filter(rs => !!rs),
    )

    this.selectedLandmarks$ = this.store.pipe(
      select('viewerState'),
      safeFilter('landmarksSelected'),
      map(state => state.landmarksSelected),
    )

    this.selectedPtLandmarks$ = this.selectedLandmarks$.pipe(
      map(lms => lms.filter(lm => lm.geometry.type === 'point')),
    )

    this.fetchedSpatialDatasets$ = this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedSpatialData'),
      map(state => state.fetchedSpatialData),
      distinctUntilChanged(this.constantService.testLandmarksChanged),
      debounceTime(300),
    )

    this.spatialResultsVisible$ = this.store.pipe(
      select('spatialSearchState'),
      map(state => isDefined(state) ?
        isDefined(state.spatialDataVisible) ?
          state.spatialDataVisible :
          true :
        true),
      distinctUntilChanged(),
    )

    this.userLandmarks$ = this.store.pipe(
      select('viewerState'),
      select('userLandmarks'),
      distinctUntilChanged(),
    )

    this.sliceViewLoadingMain$ = fromEvent(this.elementRef.nativeElement, 'sliceRenderEvent').pipe(
      scan(scanFn, [null, null, null]),
      shareReplay(1),
    )

    this.sliceViewLoading0$ = this.sliceViewLoadingMain$
      .pipe(
        map(arr => arr[0]),
      )

    this.sliceViewLoading1$ = this.sliceViewLoadingMain$
      .pipe(
        map(arr => arr[1]),
      )

    this.sliceViewLoading2$ = this.sliceViewLoadingMain$
      .pipe(
        map(arr => arr[2]),
      )

    /* missing chunk perspective view */
    this.perspectiveViewLoading$ = fromEvent(this.elementRef.nativeElement, 'perpspectiveRenderEvent')
      .pipe(
        filter(event => isDefined(event) && isDefined((event as any).detail) && isDefined((event as any).detail.lastLoadedMeshId) ),
        map(event => {

          const e = (event as any)
          const lastLoadedIdString = e.detail.lastLoadedMeshId.split(',')[0]
          const lastLoadedIdNum = Number(lastLoadedIdString)
          /**
           * TODO dig into event detail to see if the exact mesh loaded
           */
          return e.detail.meshesLoaded >= this.nehubaViewer.numMeshesToBeLoaded
            ? null
            : isNaN(lastLoadedIdNum)
              ? 'Loading unknown chunk'
              : lastLoadedIdNum >= 65500
                ? 'Loading auxiliary chunk'
                // : this.regionsLabelIndexMap.get(lastLoadedIdNum)
                //   ? `Loading ${this.regionsLabelIndexMap.get(lastLoadedIdNum).name}`
                : 'Loading meshes ...'
        }),
      )

    this.ngLayers$ = this.store.pipe(
      select('ngViewerState'),
    )

    this.hideSegmentations$ = this.ngLayers$.pipe(
      map(state => isDefined(state)
        ? state.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
        : false),
    )

    this.ngPanelTouchMove$ = fromEvent(this.elementRef.nativeElement, 'touchstart').pipe(
      switchMap((touchStartEv: TouchEvent) => fromEvent(this.elementRef.nativeElement, 'touchmove').pipe(
        tap((ev: TouchEvent) => ev.preventDefault()),
        scan((acc, curr: TouchEvent) => [curr, ...acc.slice(0, 1)], []),
        map((touchMoveEvs: TouchEvent[]) => {
          return {
            touchStartEv,
            touchMoveEvs,
          }
        }),
        takeUntil(fromEvent(this.elementRef.nativeElement, 'touchend').pipe(
          filter((ev: TouchEvent) => ev.touches.length === 0)),
        ),
      )),
    )
  }

  public useMobileUI$: Observable<boolean>

  private removeExistingPanels() {
    const element = this.nehubaViewer.nehubaViewer.ngviewer.layout.container.componentValue.element as HTMLElement
    while (element.childElementCount > 0) {
      element.removeChild(element.firstElementChild)
    }
    return element
  }

  private findPanelIndex = (panel: HTMLElement) => this.viewPanels.findIndex(p => p === panel)

  private _exportNehuba: any
  get exportNehuba() {
    if (!this._exportNehuba) {
      this._exportNehuba = getExportNehuba()
    }
    return this._exportNehuba
  }

  public ngOnInit() {

    // translation on mobile
    this.subscriptions.push(
      this.ngPanelTouchMove$.pipe(
        filter(({ touchMoveEvs }) => touchMoveEvs.length > 1 && (touchMoveEvs as TouchEvent[]).every(ev => ev.touches.length === 1)),
      ).subscribe(({ touchMoveEvs, touchStartEv }) => {

        // get deltaX and deltaY of touchmove
        const deltaX = touchMoveEvs[1].touches[0].screenX - touchMoveEvs[0].touches[0].screenX
        const deltaY = touchMoveEvs[1].touches[0].screenY - touchMoveEvs[0].touches[0].screenY

        // figure out the target of touch start
        const panelIdx = this.findPanelIndex(touchStartEv.target as HTMLElement)

        // translate if panelIdx < 3
        if (panelIdx >= 0 && panelIdx < 3) {
          const { position } = this.nehubaViewer.nehubaViewer.ngviewer.navigationState
          const pos = position.spatialCoordinates
          this.exportNehuba.vec3.set(pos, deltaX, deltaY, 0)
          this.exportNehuba.vec3.transformMat4(pos, pos, this.nehubaViewer.viewportToDatas[panelIdx])
          position.changed.dispatch()
        } else if (panelIdx === 3) {
          const {perspectiveNavigationState} = this.nehubaViewer.nehubaViewer.ngviewer
          const { vec3 } = this.exportNehuba
          perspectiveNavigationState.pose.rotateRelative(vec3.fromValues(0, 1, 0), -deltaX / 4.0 * Math.PI / 180.0)
          perspectiveNavigationState.pose.rotateRelative(vec3.fromValues(1, 0, 0), deltaY / 4.0 * Math.PI / 180.0)
          this.nehubaViewer.nehubaViewer.ngviewer.perspectiveNavigationState.changed.dispatch()
        } else {
          this.log.warn(`panelIdx not found`)
        }
      }),
    )

    // perspective reorientation on mobile
    this.subscriptions.push(
      this.ngPanelTouchMove$.pipe(
        filter(({ touchMoveEvs }) => touchMoveEvs.length > 1 && (touchMoveEvs as TouchEvent[]).every(ev => ev.touches.length === 2)),
      ).subscribe(({ touchMoveEvs, touchStartEv }) => {

        const d1 = computeDistance(
          [touchMoveEvs[1].touches[0].screenX, touchMoveEvs[1].touches[0].screenY],
          [touchMoveEvs[1].touches[1].screenX, touchMoveEvs[1].touches[1].screenY],
        )
        const d2 = computeDistance(
          [touchMoveEvs[0].touches[0].screenX, touchMoveEvs[0].touches[0].screenY],
          [touchMoveEvs[0].touches[1].screenX, touchMoveEvs[0].touches[1].screenY],
        )
        const factor = d1 / d2

        // figure out the target of touch start
        const panelIdx = this.findPanelIndex(touchStartEv.target as HTMLElement)

        // zoom slice view if slice
        if (panelIdx >= 0 && panelIdx < 3) {
          this.nehubaViewer.nehubaViewer.ngviewer.navigationState.zoomBy(factor)
        } else if (panelIdx === 3) {
          const { minZoom = null, maxZoom = null } = (this.selectedTemplate.nehubaConfig
            && this.selectedTemplate.nehubaConfig.layout
            && this.selectedTemplate.nehubaConfig.layout.useNehubaPerspective
            && this.selectedTemplate.nehubaConfig.layout.useNehubaPerspective.restrictZoomLevel)
            || {}

          const { zoomFactor } = this.nehubaViewer.nehubaViewer.ngviewer.perspectiveNavigationState
          if (!!minZoom && zoomFactor.value * factor < minZoom) { return }
          if (!!maxZoom && zoomFactor.value * factor > maxZoom) { return }
          zoomFactor.zoomBy(factor)
        }
      }),
    )

    this.hoveredPanelIndices$ = fromEvent(this.elementRef.nativeElement, 'mouseover').pipe(
      switchMap((ev: MouseEvent) => merge(
        of(this.findPanelIndex(ev.target as HTMLElement)),
        fromEvent(this.elementRef.nativeElement, 'mouseout').pipe(
          mapTo(null),
        ),
      )),
      debounceTime(20),
      shareReplay(1),
    )

    // TODO deprecate
    /* each time a new viewer is initialised, take the first event to get the translation function */
    this.subscriptions.push(
      this.newViewer$.pipe(
        switchMap(() => pipeFromArray([...takeOnePipe])(fromEvent(this.elementRef.nativeElement, 'sliceRenderEvent'))),
      ).subscribe((events) => {
        for (const idx in [0, 1, 2]) {
          const ev = events[idx] as CustomEvent
          this.viewPanels[idx] = ev.target as HTMLElement
          this.nanometersToOffsetPixelsFn[idx] = ev.detail.nanometersToOffsetPixels
        }
      }),
    )

    this.subscriptions.push(
      this.newViewer$.pipe(
        switchMapTo(fromEvent(this.elementRef.nativeElement, 'perpspectiveRenderEvent').pipe(
          take(1),
        )),
      ).subscribe(ev => this.viewPanels[3] = ((ev as CustomEvent).target) as HTMLElement),
    )

    this.subscriptions.push(
      this.redrawLayout$.subscribe(([mode, panelOrder]) => {
        const viewPanels = panelOrder.split('').map(v => Number(v)).map(idx => this.viewPanels[idx]) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement]
        /**
         * TODO be smarter with event stream
         */
        if (!this.nehubaViewer) { return }

        /**
         * TODO smarter with event stream
         */
        if (!viewPanels.every(v => !!v)) { return }

        switch (mode) {
        case H_ONE_THREE: {
          const element = this.removeExistingPanels()
          const newEl = getHorizontalOneThree(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case V_ONE_THREE: {
          const element = this.removeExistingPanels()
          const newEl = getVerticalOneThree(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case FOUR_PANEL: {
          const element = this.removeExistingPanels()
          const newEl = getFourPanel(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case SINGLE_PANEL: {
          const element = this.removeExistingPanels()
          const newEl = getSinglePanel(viewPanels)
          element.appendChild(newEl)
          break;
        }
        default:
        }
        for (const panel of viewPanels) {
          (panel as HTMLElement).classList.add('neuroglancer-panel')
        }

        // TODO needed to redraw?
        // see https://trello.com/c/oJOnlc6v/60-enlarge-panel-allow-user-rearrange-panel-position
        // further investigaation required
        this.nehubaViewer.redraw()
      }),
    )

    this.subscriptions.push(
      this.fetchedSpatialDatasets$.subscribe(datasets => {
        this.landmarksLabelIndexMap = new Map(datasets.map((v, idx) => [idx, v]) as Array<[number, any]>)
        this.landmarksNameMap = new Map(datasets.map((v, idx) => [v.name, idx] as [string, number]))
      }),
    )

    this.subscriptions.push(
      combineLatest(
        this.fetchedSpatialDatasets$,
        this.spatialResultsVisible$,
      ).subscribe(([fetchedSpatialData, visible]) => {
        this.fetchedSpatialData = fetchedSpatialData

        if (visible && this.fetchedSpatialData && this.fetchedSpatialData.length > 0) {
          this.nehubaViewer.addSpatialSearch3DLandmarks(
            this.fetchedSpatialData
              .map(data => data.geometry.type === 'point'
                ? (data.geometry as IPointLandmarkGeometry).position
                : data.geometry.type === 'plane'
                  ? [
                    (data.geometry as IPlaneLandmarkGeometry).corners,
                    [[0, 1, 2], [0, 2, 3]],
                  ]
                  : data.geometry.type === 'mesh'
                    ? [
                      (data.geometry as IOtherLandmarkGeometry).vertices,
                      (data.geometry as IOtherLandmarkGeometry).meshIdx,
                    ]
                    : null),
          )
        } else {
          if (this.nehubaViewer && this.nehubaViewer.removeSpatialSearch3DLandmarks instanceof Function) {
            this.nehubaViewer.removeSpatialSearch3DLandmarks()
          }
        }
      }),
    )

    this.subscriptions.push(
      this.userLandmarks$.subscribe(landmarks => {
        if (this.nehubaViewer) {
          this.nehubaViewer.updateUserLandmarks(landmarks)
        }
      }),
    )

    this.subscriptions.push(
      this.spatialResultsVisible$.subscribe(visible => this.spatialResultsVisible = visible),
    )

    this.subscriptions.push(
      this.newViewer$.pipe(
        skip(1),
      ).subscribe(() => {

        /* on selecting of new template, remove additional nglayers */
        const baseLayerNames = Object.keys(this.selectedTemplate.nehubaConfig.dataset.initialNgState.layers)
        this.ngLayersRegister.layers
          .filter(layer => baseLayerNames.findIndex(l => l === layer.name) < 0)
          .map(l => l.name)
          .forEach(layerName => {
            this.store.dispatch({
              type : REMOVE_NG_LAYER,
              layer : {
                name : layerName,
              },
            })
          })
      }),
    )

    this.subscriptions.push(
      this.templateSelected$.subscribe(() => this.destroynehuba()),
    )

    /* order of subscription will determine the order of execution */
    this.subscriptions.push(
      this.newViewer$.pipe(
        map(templateSelected => {
          const deepCopiedState = JSON.parse(JSON.stringify(templateSelected))
          const navigation = deepCopiedState.nehubaConfig.dataset.initialNgState.navigation
          if (!navigation) {
            return deepCopiedState
          }
          navigation.zoomFactor = calculateSliceZoomFactor(navigation.zoomFactor)
          deepCopiedState.nehubaConfig.dataset.initialNgState.navigation = navigation
          return deepCopiedState
        }),
        withLatestFrom(
          this.selectedParcellation$.pipe(
            startWith(null),
          )
        ),
      ).subscribe(([templateSelected, parcellationSelected]) => {

        this.selectedTemplate = templateSelected
        this.createNewNehuba(templateSelected)
        const foundParcellation = parcellationSelected
          && templateSelected.parcellations.find(parcellation => parcellationSelected.name === parcellation.name)
        this.handleParcellation(foundParcellation || templateSelected.parcellations[0])

        const nehubaConfig = templateSelected.nehubaConfig
        const initialSpec = nehubaConfig.dataset.initialNgState
        const {layers} = initialSpec

        const dispatchLayers = Object.keys(layers).map(key => {
          const layer = {
            name : key,
            source : layers[key].source,
            mixability : layers[key].type === 'image'
              ? 'base'
              : 'mixable',
            visible : typeof layers[key].visible === 'undefined'
              ? true
              : layers[key].visible,
            transform : typeof layers[key].transform === 'undefined'
              ? null
              : layers[key].transform,
          }
          this.ngLayersRegister.layers.push(layer)
          return layer
        })

        this.store.dispatch({
          type : ADD_NG_LAYER,
          layer : dispatchLayers,
        })
      }),
    )

    this.subscriptions.push(
      this.selectedParcellation$.subscribe((this.handleParcellation).bind(this)),
    )

    this.subscriptions.push(

      combineLatest(
        this.selectedRegions$.pipe(
          distinctUntilChanged(),
        ),
        this.hideSegmentations$.pipe(
          distinctUntilChanged(),
        ),
        this.ngLayers$.pipe(
          map(state => state.forceShowSegment),
          distinctUntilChanged(),
        ),
        this.selectedParcellation$,
      ).pipe(
        delayWhen(() => timer())
      ).subscribe(([regions, hideSegmentFlag, forceShowSegment, selectedParcellation]) => {
        if (!this.nehubaViewer) { return }

        const { ngId: defaultNgId } = selectedParcellation

        /* selectedregionindexset needs to be updated regardless of forceshowsegment */
        this.selectedRegionIndexSet = new Set(regions.map(({ngId = defaultNgId, labelIndex}) => generateLabelIndexId({ ngId, labelIndex })))

        if ( forceShowSegment === false || (forceShowSegment === null && hideSegmentFlag) ) {
          this.nehubaViewer.hideAllSeg()
          return
        }

        this.selectedRegionIndexSet.size > 0
          ? this.nehubaViewer.showSegs([...this.selectedRegionIndexSet])
          : this.nehubaViewer.showAllSeg()
      }),
    )

    this.subscriptions.push(
      this.ngLayers$.subscribe(ngLayersInterface => {
        if (!this.nehubaViewer) { return }

        const newLayers = ngLayersInterface.layers.filter(l => this.ngLayersRegister.layers.findIndex(ol => ol.name === l.name) < 0)
        const removeLayers = this.ngLayersRegister.layers.filter(l => ngLayersInterface.layers.findIndex(nl => nl.name === l.name) < 0)

        if (newLayers.length > 0) {
          const newLayersObj: any = {}
          newLayers.forEach(({ name, source, ...rest }) => newLayersObj[name] = {
            ...rest,
            source,
            // source: getProxyUrl(source),
            // ...getProxyOther({source})
          })

          if (!this.nehubaViewer.nehubaViewer || !this.nehubaViewer.nehubaViewer.ngviewer) {
            this.nehubaViewer.initNiftiLayers.push(newLayersObj)
          } else {
            this.nehubaViewer.loadLayer(newLayersObj)
          }
          this.ngLayersRegister.layers = this.ngLayersRegister.layers.concat(newLayers)
        }

        if (removeLayers.length > 0) {
          removeLayers.forEach(l => {
            if (this.nehubaViewer.removeLayer({
              name : l.name,
            })) {
              this.ngLayersRegister.layers = this.ngLayersRegister.layers.filter(rl => rl.name !== l.name)
            }
          })
        }
      }),
    )

    /* setup init view state */
    
    this.selectedRegions$.pipe(
      filter(() => !!this.nehubaViewer),
    ).subscribe(regions => {
      this.nehubaViewer.initRegions = regions.map(({ ngId, labelIndex }) => generateLabelIndexId({ ngId, labelIndex }))
    })

    /* handler to open/select landmark */
    const clickObs$ = fromEvent(this.elementRef.nativeElement, 'click')

    this.subscriptions.push(
      clickObs$.pipe(
        buffer(
          clickObs$.pipe(
            debounceTime(200),
          ),
        ),
        filter(arr => arr.length >= 2),
      )
        .subscribe(() => {
          const { currentOnHover } = this
          this.store.dispatch({
            type : VIEWERSTATE_ACTION_TYPES.DOUBLE_CLICK_ON_VIEWER,
            payload: { ...currentOnHover },
          })
        }),
    )

    this.subscriptions.push(
      this.selectedLandmarks$.pipe(
        map(lms => lms.map(lm => this.landmarksNameMap.get(lm.name))),
        debounceTime(16),
      ).subscribe(indices => {
        const filteredIndices = indices.filter(v => typeof v !== 'undefined' && v !== null)
        if (this.nehubaViewer) {
          this.nehubaViewer.spatialLandmarkSelectionChanged(filteredIndices)
        }
      }),
    )
  }

  // datasetViewerRegistry : Set<string> = new Set()
  public showObliqueScreen$: Observable<boolean>
  public showObliqueSelection$: Observable<boolean>
  public showObliqueRotate$: Observable<boolean>

  public ngOnChanges() {
    if (this.currentOnHoverObs$) {
      this.onHoverSegments$ = this.currentOnHoverObs$.pipe(
        map(({ segments }) => segments),
      )

      const sortByFreshness: (acc: any[], curr: any[]) => any[] = (acc, curr) => {

        const getLayerName = ({layer} = {layer: {}}) => {
          const { name } = layer as any
          return name
        }

        const newEntries = (curr && curr.filter(entry => {
          const name = getLayerName(entry)
          return acc.map(getLayerName).indexOf(name) < 0
        })) || []

        const entryChanged: (itemPrevState, newArr) => boolean = (itemPrevState, newArr) => {
          const layerName = getLayerName(itemPrevState)
          const { segment } = itemPrevState
          const foundItem = newArr.find((_item) =>
            getLayerName(_item) === layerName)

          if (foundItem) {
            const { segment: foundSegment } = foundItem
            return segment !== foundSegment
          } else {
            /**
             * if item was not found in the new array, meaning hovering nothing
             */
            return segment !== null
          }
        }

        const getItemFromLayerName = (item, arr) => {
          const foundItem = arr.find(i => getLayerName(i) === getLayerName(item))
          return foundItem
            ? foundItem
            : {
              layer: item.layer,
              segment: null,
            }
        }

        const getReduceExistingLayers = (newArr) => ([changed, unchanged], _curr) => {
          const changedFlag = entryChanged(_curr, newArr)
          return changedFlag
            ? [ changed.concat( getItemFromLayerName(_curr, newArr) ), unchanged ]
            : [ changed, unchanged.concat(_curr) ]
        }

        /**
         * now, for all the previous layers, separate into changed and unchanged layers
         */
        const [changed, unchanged] = acc.reduce(getReduceExistingLayers(curr), [[], []])
        return [...newEntries, ...changed, ...unchanged]
      }

      // TODO to be deprected soon

      this.onHoverSegment$ = this.onHoverSegments$.pipe(
        scan(sortByFreshness, []),
        /**
         * take the first element after sort by freshness
         */
        map(arr => arr[0]),
        /**
         * map to the older interface
         */
        filter(v => !!v),
        map(({ segment }) => {
          return {
            labelIndex: (isNaN(segment) && Number(segment.labelIndex)) || null,
            foundRegion: (isNaN(segment) && segment) || null,
          }
        }),
      )
    }
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public toggleMaximiseMinimise(index: number) {
    this.store.dispatch({
      type: NG_VIEWER_ACTION_TYPES.TOGGLE_MAXIMISE,
      payload: {
        index,
      },
    })
  }

  public tunableMobileProperties = ['Oblique Rotate X', 'Oblique Rotate Y', 'Oblique Rotate Z', 'Remove extra layers']
  public selectedProp = null

  public handleMobileOverlayTouchEnd(focusItemIndex) {
    if (this.tunableMobileProperties[focusItemIndex] === 'Remove extra layers') {
      this.store.dispatch({
        type: NG_VIEWER_ACTION_TYPES.REMOVE_ALL_NONBASE_LAYERS,
      })
    }
  }

  public handleMobileOverlayEvent(obj: any) {
    const {delta, selectedProp} = obj
    this.selectedProp = selectedProp

    const idx = this.tunableMobileProperties.findIndex(p => p === selectedProp)
    if (idx === 0) { this.nehubaViewer.obliqueRotateX(delta) }
    if (idx === 1) { this.nehubaViewer.obliqueRotateY(delta) }
    if (idx === 2) { this.nehubaViewer.obliqueRotateZ(delta) }
  }

  public returnTruePos(quadrant: number, data: any) {
    const pos = quadrant > 2 ?
      [0, 0, 0] :
      this.nanometersToOffsetPixelsFn && this.nanometersToOffsetPixelsFn[quadrant] ?
        this.nanometersToOffsetPixelsFn[quadrant](data.geometry.position.map(n => n * 1e6)) :
        [0, 0, 0]
    return pos
  }

  public getPositionX(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[0]
  }
  public getPositionY(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[1]
  }
  public getPositionZ(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[2]
  }

  // handles mouse enter/leave landmarks in 2D
  public handleMouseEnterLandmark(spatialData: any) {
    spatialData.highlight = true
    this.store.dispatch({
      type : MOUSE_OVER_LANDMARK,
      landmark : spatialData._label,
    })
  }

  public handleMouseLeaveLandmark(spatialData: any) {
    spatialData.highlight = false
    this.store.dispatch({
      type : MOUSE_OVER_LANDMARK,
      landmark : null,
    })
  }

  private handleParcellation(parcellation: any) {
    /**
     * parcellaiton may be undefined
     */
    if ( !(parcellation && parcellation.regions)) {
      return
    }

    /**
     * first, get all all the ngIds, including parent id from parcellation (if defined)
     */
    const ngIds = getNgIds(parcellation.regions).concat( parcellation.ngId ? parcellation.ngId : [])

    this.multiNgIdsRegionsLabelIndexMap = getMultiNgIdsRegionsLabelIndexMap(parcellation)

    this.nehubaViewer.multiNgIdsLabelIndexMap = this.multiNgIdsRegionsLabelIndexMap
    this.nehubaViewer.auxilaryMeshIndices = parcellation.auxillaryMeshIndices || []

    /* TODO replace with proper KG id */
    /**
     * need to set unique array of ngIds, or else workers will be overworked
     */
    this.nehubaViewer.ngIds = Array.from(new Set(ngIds))
    this.selectedParcellation = parcellation
  }

  /* related spatial search */
  public spatialSearchPagination: number = 0

  private destroynehuba() {
    /**
     * TODO if plugin subscribes to viewerHandle, and then new template is selected, changes willl not be be sent
     * could be considered as a bug.
     */
    this.apiService.interactiveViewer.viewerHandle = null
    this.nehubaContainerDirective.clear()

    this.nehubaViewer = null

    this.cdr.detectChanges()
  }

  private createNewNehuba(template: any) {

    this.nehubaContainerDirective.createNehubaInstance(template)
    this.nehubaViewer = this.nehubaContainerDirective.nehubaViewerInstance

    this.setupViewerHandleApi()
  }

  private setupViewerHandleApi() {
    this.apiService.interactiveViewer.viewerHandle = {
      setNavigationLoc : (coord, realSpace?) => this.nehubaViewer.setNavigationState({
        position : coord,
        positionReal : typeof realSpace !== 'undefined' ? realSpace : true,
      }),
      /* TODO introduce animation */
      moveToNavigationLoc : (coord, realSpace?) => this.nehubaViewer.setNavigationState({
        position : coord,
        positionReal : typeof realSpace !== 'undefined' ? realSpace : true,
      }),
      setNavigationOri : (quat) => this.nehubaViewer.setNavigationState({
        orientation : quat,
      }),
      /* TODO introduce animation */
      moveToNavigationOri : (quat) => this.nehubaViewer.setNavigationState({
        orientation : quat,
      }),
      showSegment : (_labelIndex) => {
        /**
         * TODO reenable with updated select_regions api
         */
        this.log.warn(`showSegment is temporarily disabled`)

        // if(!this.selectedRegionIndexSet.has(labelIndex))
        //   this.store.dispatch({
        //     type : SELECT_REGIONS,
        //     selectRegions :  [labelIndex, ...this.selectedRegionIndexSet]
        //   })
      },
      add3DLandmarks : landmarks => {
        // TODO check uniqueness of ID
        if (!landmarks.every(l => isDefined(l.id))) {
          throw new Error('every landmarks needs to be identified with the id field')
        }
        if (!landmarks.every(l => isDefined(l.position))) {
          throw new Error('every landmarks needs to have position defined')
        }
        if (!landmarks.every(l => l.position.constructor === Array) || !landmarks.every(l => l.position.every(v => !isNaN(v))) || !landmarks.every(l => l.position.length == 3)) {
          throw new Error('position needs to be a length 3 tuple of numbers ')
        }
        this.store.dispatch({
          type: VIEWERSTATE_ACTION_TYPES.ADD_USERLANDMARKS,
          landmarks,
        })
      },
      remove3DLandmarks : landmarkIds => {
        this.store.dispatch({
          type: VIEWERSTATE_ACTION_TYPES.REMOVE_USER_LANDMARKS,
          payload: {
            landmarkIds,
          },
        })
      },
      hideSegment : (_labelIndex) => {
        /**
         * TODO reenable with updated select_regions api
         */
        this.log.warn(`hideSegment is temporarily disabled`)

        // if(this.selectedRegionIndexSet.has(labelIndex)){
        //   this.store.dispatch({
        //     type :SELECT_REGIONS,
        //     selectRegions : [...this.selectedRegionIndexSet].filter(num=>num!==labelIndex)
        //   })
        // }
      },
      showAllSegments : () => {
        const selectRegionIds = []
        this.multiNgIdsRegionsLabelIndexMap.forEach((map, ngId) => {
          Array.from(map.keys()).forEach(labelIndex => {
            selectRegionIds.push(generateLabelIndexId({ ngId, labelIndex }))
          })
        })
        this.store.dispatch({
          type : SELECT_REGIONS_WITH_ID,
          selectRegionIds,
        })
      },
      hideAllSegments : () => {
        this.store.dispatch({
          type : SELECT_REGIONS_WITH_ID,
          selectRegions : [],
        })
      },
      segmentColourMap : new Map(),
      getLayersSegmentColourMap: () => this.nehubaViewer.multiNgIdColorMap,
      applyColourMap : (_map) => {
        throw new Error(`apply color map has been deprecated. use applyLayersColourMap instead`)
      },
      applyLayersColourMap: (map) => {
        this.nehubaViewer.setColorMap(map)
      },
      loadLayer : (layerObj) => this.nehubaViewer.loadLayer(layerObj),
      removeLayer : (condition) => this.nehubaViewer.removeLayer(condition),
      setLayerVisibility : (condition, visible) => this.nehubaViewer.setLayerVisibility(condition, visible),
      mouseEvent : merge(
        fromEvent(this.elementRef.nativeElement, 'click').pipe(
          map((ev: MouseEvent) => ({eventName : 'click', event: ev})),
        ),
        fromEvent(this.elementRef.nativeElement, 'mousemove').pipe(
          map((ev: MouseEvent) => ({eventName : 'mousemove', event: ev})),
        ),
        /**
         * neuroglancer prevents propagation, so use capture instead
         */
        Observable.create(observer => {
          this.elementRef.nativeElement.addEventListener('mousedown', event => observer.next({eventName: 'mousedown', event}), true)
        }) as Observable<{eventName: string, event: MouseEvent}>,
        fromEvent(this.elementRef.nativeElement, 'mouseup').pipe(
          map((ev: MouseEvent) => ({eventName : 'mouseup', event: ev})),
        ),
      ) ,
      mouseOverNehuba : this.onHoverSegment$.pipe(
        tap(() => this.log.warn('mouseOverNehuba observable is becoming deprecated. use mouseOverNehubaLayers instead.')),
      ),
      mouseOverNehubaLayers: this.onHoverSegments$,
      getNgHash : this.nehubaViewer.getNgHash,
    }
  }

}

export const identifySrcElement = (element: HTMLElement) => {
  const elementIsFirstRow = isFirstRow(element)
  const elementIsFirstCell = isFirstCell(element)

  return elementIsFirstCell && elementIsFirstRow
    ? 0
    : !elementIsFirstCell && elementIsFirstRow
      ? 1
      : elementIsFirstCell && !elementIsFirstRow
        ? 2
        : !elementIsFirstCell && !elementIsFirstRow
          ? 3
          : 4
}

export const takeOnePipe = [
  scan((acc: Event[], event: Event) => {
    const target = (event as Event).target as HTMLElement
    /**
     * 0 | 1
     * 2 | 3
     *
     * 4 ???
     */
    const key = identifySrcElement(target)
    const _ = {}
    _[key] = event
    return Object.assign({}, acc, _)
  }, []),
  filter(v => {
    const isdefined = (obj) => typeof obj !== 'undefined' && obj !== null
    return (isdefined(v[0]) && isdefined(v[1]) && isdefined(v[2]))
  }),
  take(1),
]
