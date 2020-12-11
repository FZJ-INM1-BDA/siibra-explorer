import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, Output, EventEmitter, Inject, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, fromEvent, merge, Observable, of, Subscription, timer, asyncScheduler, BehaviorSubject, Subject } from "rxjs";
import { buffer, debounceTime, distinctUntilChanged, filter, map, mapTo, scan, shareReplay, skip, startWith, switchMap, switchMapTo, take, tap, withLatestFrom, delayWhen, throttleTime } from "rxjs/operators";
import { trigger, state, style, animate, transition } from '@angular/animations'
import { MatDrawer } from "@angular/material/sidenav";

import { LoggingService } from "src/logging";
import {
  CHANGE_NAVIGATION,
  generateLabelIndexId,
  getMultiNgIdsRegionsLabelIndexMap,
  getNgIds,
  ILandmark,
  IOtherLandmarkGeometry,
  IPlaneLandmarkGeometry,
  IPointLandmarkGeometry,
  isDefined,
  MOUSE_OVER_LANDMARK,
  NgViewerStateInterface
} from "src/services/stateStore.service";

import { getExportNehuba, isSame } from "src/util/fn";
import { API_SERVICE_SET_VIEWER_HANDLE_TOKEN, IUserLandmark } from "src/atlasViewer/atlasViewer.apiService.service";
import { NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { compareLandmarksChanged } from "src/util/constants";
import { PureContantService } from "src/util";
import { ARIA_LABELS, IDS, CONST } from 'common/constants'
import { ngViewerActionSetPerspOctantRemoval, PANELS, ngViewerActionToggleMax, ngViewerActionAddNgLayer, ngViewerActionRemoveNgLayer } from "src/services/state/ngViewerState.store.helper";
import { viewerStateSelectRegionWithIdDeprecated, viewerStateAddUserLandmarks, viewreStateRemoveUserLandmarks, viewerStateCustomLandmarkSelector, viewerStateSelectedParcellationSelector, viewerStateSelectedTemplateSelector, viewerStateSelectedRegionsSelector } from 'src/services/state/viewerState.store.helper'
import { SwitchDirective } from "src/util/directives/switch.directive";
import {
  viewerStateDblClickOnViewer,
} from "src/services/state/viewerState.store.helper";

import { getFourPanel, getHorizontalOneThree, getSinglePanel, getVerticalOneThree, calculateSliceZoomFactor, scanSliceViewRenderFn as scanFn, takeOnePipe } from "./util";
import { NehubaViewerContainerDirective } from "./nehubaViewerInterface/nehubaViewerInterface.directive";
import { ITunableProp } from "./mobileOverlay/mobileOverlay.component";
import {ConnectivityBrowserComponent} from "src/ui/connectivityBrowser/connectivityBrowser.component";
import { viewerStateMouseOverCustomLandmark } from "src/services/state/viewerState/actions";
import { ngViewerSelectorNehubaReady, ngViewerSelectorOctantRemoval, ngViewerSelectorPanelMode, ngViewerSelectorPanelOrder } from "src/services/state/ngViewerState/selectors";
import { REGION_OF_INTEREST } from "src/util/interfaces";
import { uiActionHideAllDatasets, uiActionHideDatasetWithId } from "src/services/state/uiState/actions";

const { MESH_LOADING_STATUS } = IDS

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
    const foundItem = newArr?.find((_item) =>
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
    const foundItem = arr?.find(i => getLayerName(i) === getLayerName(item))
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

const {
  ZOOM_IN,
  ZOOM_OUT,
  TOGGLE_FRONTAL_OCTANT,
  TOGGLE_SIDE_PANEL,
  EXPAND,
  COLLAPSE,
  ADDITIONAL_VOLUME_CONTROL,
} = ARIA_LABELS

@Component({
  selector : 'ui-nehuba-container',
  templateUrl : './nehubaContainer.template.html',
  styleUrls : [
    `./nehubaContainer.style.css`,
  ],
  animations: [
    trigger('openClose', [
      state('open', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('closed', style({
        transform: 'translateY(-100vh)',
        opacity: 0
      })),
      transition('open => closed', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ]),
      transition('closed => open', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ])
    ]),
    trigger('openCloseAnchor', [
      state('open', style({
        transform: 'translateY(0)'
      })),
      state('closed', style({
        transform: 'translateY(100vh)'
      })),
      transition('open => closed', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ]),
      transition('closed => open', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ])
    ]),
  ],
  exportAs: 'uiNehubaContainer',
  providers: [
    {
      provide: REGION_OF_INTEREST,
      useFactory: (store: Store<any>) => store.pipe(
        select(viewerStateSelectedRegionsSelector),
        map(rs => rs[0] || null)
      ),
      deps: [
        Store
      ]
    }
  ]
})

export class NehubaContainer implements OnInit, OnChanges, OnDestroy {

  public CONST = CONST
  public ARIA_LABEL_ZOOM_IN = ZOOM_IN
  public ARIA_LABEL_ZOOM_OUT = ZOOM_OUT
  public ARIA_LABEL_TOGGLE_FRONTAL_OCTANT = TOGGLE_FRONTAL_OCTANT
  public ARIA_LABEL_TOGGLE_SIDE_PANEL = TOGGLE_SIDE_PANEL
  public ARIA_LABEL_EXPAND = EXPAND
  public ARIA_LABEL_COLLAPSE = COLLAPSE
  public ARIA_LABEL_ADDITIONAL_VOLUME_CONTROL = ADDITIONAL_VOLUME_CONTROL
  
  public ID_MESH_LOADING_STATUS = MESH_LOADING_STATUS

  @ViewChild(NehubaViewerContainerDirective,{static: true})
  public nehubaContainerDirective: NehubaViewerContainerDirective

  @ViewChild('sideNavMasterSwitch', { static: true })
  public navSideDrawerMainSwitch: SwitchDirective
  @ViewChild('sideNavSwitch', { static: true })
  public navSideDrawerMinorSwitch: SwitchDirective

  @ViewChild('matDrawerMaster', {static: true})
  public matDrawerMain: MatDrawer
  @ViewChild('matDrawerMinor', { static: true })
  public matDrawerMinor: MatDrawer

  @Output()
  public nehubaViewerLoaded: EventEmitter<boolean> = new EventEmitter()

  @Output()
  public forceUI$: Observable<{ target: 'perspective:octantRemoval', mode: boolean,  message?: string }>

  public disableOctantRemoval$: Observable<{ message?: string, mode: boolean }>

  public handleViewerLoadedEvent(flag: boolean){
    this.viewerLoaded = flag
    this.nehubaViewerLoaded.emit(flag)
  }

  public viewerLoaded: boolean = false

  private sliceRenderEvent$: Observable<CustomEvent>
  public sliceViewLoadingMain$: Observable<[boolean, boolean, boolean]>
  public perspectiveViewLoading$: Observable<string|null>
  public showPerpsectiveScreen$: Observable<string>

  public templateSelected$: Observable<any> = this.store.pipe(
    select(viewerStateSelectedTemplateSelector),
    distinctUntilChanged(isSame),
  )

  private newViewer$: Observable<any> = this.templateSelected$.pipe(
    filter(v => !!v),
  )

  private selectedParcellation$: Observable<any> = this.store.pipe(
    select(viewerStateSelectedParcellationSelector),
    distinctUntilChanged(),
    filter(v => !!v)
  )
  public selectedRegions: any[] = []
  public selectedRegions$: Observable<any[]> = this.store.pipe(
    select(viewerStateSelectedRegionsSelector),
    filter(rs => !!rs),
  )

  public selectedLandmarks$: Observable<any[]>
  public selectedPtLandmarks$: Observable<any[]>
  public customLandmarks$: Observable<any> = this.store.pipe(
    select(viewerStateCustomLandmarkSelector),
    map(lms => lms.map(lm => ({
      ...lm,
      geometry: {
        position: lm.position
      }
    })))
  )
  private hideSegmentations$: Observable<boolean>

  private fetchedSpatialDatasets$: Observable<ILandmark[]>
  private userLandmarks$: Observable<IUserLandmark[]>

  public nehubaViewerPerspectiveOctantRemoval$: Observable<boolean>

  @Input()
  private currentOnHover: {segments: any, landmark: any, userLandmark: any}

  @Input()
  currentOnHoverObs$: Observable<{segments: any, landmark: any, userLandmark: any}>

  public iavAdditionalLayers$ = new Subject<any[]>()

  public alwaysHideMinorPanel$: Observable<boolean> = combineLatest(
    this.selectedRegions$,
    this.iavAdditionalLayers$.pipe(
      startWith([])
    )
  ).pipe(
    map(([ regions, layers ]) => regions.length === 0 && layers.length === 0)
  )

  public onHoverSegments$: BehaviorSubject<any[]> = new BehaviorSubject([])
  public onHoverSegment$: Observable<any> = this.onHoverSegments$.pipe(
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

  public selectedTemplate: any | null
  private selectedRegionIndexSet: Set<string> = new Set()
  public fetchedSpatialData: ILandmark[] = []

  private ngLayersRegister: Partial<NgViewerStateInterface> = {layers : [], forceShowSegment: null}
  private ngLayers$: Observable<NgViewerStateInterface>

  public selectedParcellation: any | null

  public nehubaViewer: NehubaViewerUnit = null
  private multiNgIdsRegionsLabelIndexMap: Map<string, Map<number, any>> = new Map()
  private landmarksLabelIndexMap: Map<number, any> = new Map()
  private landmarksNameMap: Map<string, number> = new Map()

  private subscriptions: Subscription[] = []

  public nanometersToOffsetPixelsFn: Array<(...arg) => any> = []

  public viewPanels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement] = [null, null, null, null]
  public panelMode$: Observable<string>

  public panelOrder$: Observable<string>
  private redrawLayout$: Observable<[string, string]>

  public hoveredPanelIndices$: Observable<number>

  public connectivityNumber: string
  public connectivityLoadUrl: string

  constructor(
    private pureConstantService: PureContantService,
    @Optional() @Inject(API_SERVICE_SET_VIEWER_HANDLE_TOKEN) private setViewerHandle: (arg) => void,
    private store: Store<any>,
    private elementRef: ElementRef,
    private log: LoggingService,
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(REGION_OF_INTEREST) public regionOfInterest$: Observable<any>
  ) {

    this.useMobileUI$ = this.pureConstantService.useTouchUI$

    this.nehubaViewerPerspectiveOctantRemoval$ = this.store.pipe(
      select(ngViewerSelectorOctantRemoval),
    )

    this.panelMode$ = this.store.pipe(
      select(ngViewerSelectorPanelMode),
      distinctUntilChanged(),
      shareReplay(1),
    )

    this.panelOrder$ = this.store.pipe(
      select(ngViewerSelectorPanelOrder),
      distinctUntilChanged(),
      shareReplay(1),
    )

    this.redrawLayout$ = this.store.pipe(
      select(ngViewerSelectorNehubaReady),
      distinctUntilChanged(),
      filter(v => !!v),
      switchMapTo(combineLatest([
        this.panelMode$,
        this.panelOrder$,
      ])),
    )

    this.selectedLandmarks$ = this.store.pipe(
      select('viewerState'),
      select('landmarksSelected'),
    )

    this.selectedPtLandmarks$ = this.selectedLandmarks$.pipe(
      map(lms => lms.filter(lm => lm.geometry.type === 'point')),
    )

    this.fetchedSpatialDatasets$ = this.store.pipe(
      select('dataStore'),
      select('fetchedSpatialData'),
      distinctUntilChanged(compareLandmarksChanged),
      filter(v => !!v),
      startWith([]),
      debounceTime(300),
    )

    this.userLandmarks$ = this.store.pipe(
      select(viewerStateCustomLandmarkSelector),
      distinctUntilChanged(),
    )

    /**
     * in future, perhaps add other force UI optinos here
     */
    this.forceUI$ = this.userLandmarks$.pipe(
      map(lm => {
        if (lm.length > 0) {
          return {
            target: 'perspective:octantRemoval',
            mode: false,
            message: `octant control disabled: showing landmarks.`
          }
        } else {
          return {
            target: 'perspective:octantRemoval',
            mode: null
          }
        }
      })
    )

    this.disableOctantRemoval$ = this.forceUI$.pipe(
      filter(({ target }) => target === 'perspective:octantRemoval'),
    )

    this.sliceRenderEvent$ = fromEvent(this.elementRef.nativeElement, 'sliceRenderEvent').pipe(
      map(ev => ev as CustomEvent)
    )

    this.sliceViewLoadingMain$ = this.sliceRenderEvent$.pipe(
      scan(scanFn, [null, null, null]),
      startWith([true, true, true] as [boolean, boolean, boolean]),
      shareReplay(1),
    )

    this.showPerpsectiveScreen$ = this.newViewer$.pipe(
      switchMapTo(this.sliceRenderEvent$.pipe(
        scan((acc, curr) => {

          /**
           * if at any point, all chunks have been loaded, always return loaded state
           */
          if (acc.every(v => v === 0)) return [0, 0, 0]
          const { detail = {}, target } = curr || {}
          const { missingChunks = -1, missingImageChunks = -1 } = detail
          const idx = this.findPanelIndex(target as HTMLElement)
          const returnAcc = [...acc]
          if (idx >= 0) {
            returnAcc[idx] = missingChunks + missingImageChunks
          }
          return returnAcc
        }, [-1, -1, -1]),
        map(arr => {
          let sum = 0
          let uncertain = false
          for (const num of arr) {
            if (num < 0) {
              uncertain = true
            } else {
              sum += num
            }
          }
          return sum > 0
            ? `Loading ${sum}${uncertain ? '+' : ''} chunks ...`
            : null
        }),
        distinctUntilChanged(),
        startWith('Loading ...'),
        throttleTime(100, asyncScheduler, { leading: true, trailing: true }),
        shareReplay(1),
      ))
    )

    /* missing chunk perspective view */
    this.perspectiveViewLoading$ = fromEvent(this.elementRef.nativeElement, 'perpspectiveRenderEvent')
      .pipe(
        filter(event => isDefined(event) && isDefined((event as any).detail) && isDefined((event as any).detail.lastLoadedMeshId) ),
        map(event => {

          /**
           * TODO dig into event detail to see if the exact mesh loaded
           */
          const { meshesLoaded, meshFragmentsLoaded, lastLoadedMeshId } = (event as any).detail
          return meshesLoaded >= this.nehubaViewer.numMeshesToBeLoaded
            ? null
            : 'Loading meshes ...'
        }),
        distinctUntilChanged()
      )

    this.ngLayers$ = this.store.pipe(
      select('ngViewerState'),
    )

    this.hideSegmentations$ = this.ngLayers$.pipe(
      map(state => isDefined(state)
        ? state.layers?.findIndex(l => l.mixability === 'nonmixable') >= 0
        : false),
    )

    /**
     * fixes 
     * https://github.com/HumanBrainProject/interactive-viewer/issues/800
     */
    this.subscriptions.push(
      this.nehubaViewerLoaded.pipe(
        debounceTime(500),
        filter(v => !v),
      ).subscribe(() => {
        this.matDrawerMain.close()
        this.matDrawerMinor.close()
      })
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

  private findPanelIndex = (panel: HTMLElement) => this.viewPanels?.findIndex(p => p === panel)

  private _exportNehuba: any
  get exportNehuba() {
    if (!this._exportNehuba) {
      this._exportNehuba = getExportNehuba()
    }
    return this._exportNehuba
  }

  public ngOnInit() {
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
        switchMapTo(this.sliceRenderEvent$.pipe(
          takeOnePipe()
        ))
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
        case PANELS.H_ONE_THREE: {
          const element = this.removeExistingPanels()
          const newEl = getHorizontalOneThree(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case PANELS.V_ONE_THREE: {
          const element = this.removeExistingPanels()
          const newEl = getVerticalOneThree(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case PANELS.FOUR_PANEL: {
          const element = this.removeExistingPanels()
          const newEl = getFourPanel(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case PANELS.SINGLE_PANEL: {
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

    /**
     * TODO deprecate, but document the method
     */
    this.subscriptions.push(
      combineLatest(
        this.fetchedSpatialDatasets$,
      ).subscribe(([fetchedSpatialData]) => {
        this.fetchedSpatialData = fetchedSpatialData

        if (this.fetchedSpatialData?.length > 0) {
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
      this.userLandmarks$.pipe(
        withLatestFrom(
          this.nehubaViewerPerspectiveOctantRemoval$
        )
      ).subscribe(([landmarks, flag]) => {
        if (this.nehubaContainerDirective) {
          this.nehubaContainerDirective.toggleOctantRemoval(
            landmarks.length > 0 ? false : flag
          )
        }
        if (this.nehubaViewer) {
          this.nehubaViewer.updateUserLandmarks(landmarks)
        }
      }),
    )

    this.subscriptions.push(
      this.newViewer$.pipe(
        skip(1),
      ).subscribe(() => {

        /* on selecting of new template, remove additional nglayers */
        const baseLayerNames = Object.keys(this.selectedTemplate.nehubaConfig.dataset.initialNgState.layers)
        this.ngLayersRegister.layers
          .filter(layer => baseLayerNames?.findIndex(l => l === layer.name) < 0)
          .map(l => l.name)
          .forEach(layerName => {
            this.store.dispatch(ngViewerActionRemoveNgLayer({
              layer: {
                name: layerName
              }
            }))
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
          && templateSelected?.parcellations?.find(parcellation => parcellationSelected.name === parcellation.name)
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

        this.store.dispatch(ngViewerActionAddNgLayer({
          layer: dispatchLayers
        }))
      })
    )

    let prevParcellation = null

    this.subscriptions.push(

      combineLatest([
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
        this.store.pipe(
          select('viewerState'),
          select('overwrittenColorMap'),
          distinctUntilChanged()
        )
      ]).pipe(
        delayWhen(() => timer())
      ).subscribe(([regions, hideSegmentFlag, forceShowSegment, selectedParcellation, overwrittenColorMap]) => {
        if (!this.nehubaViewer) { return }

        const { ngId: defaultNgId } = selectedParcellation

        /* selectedregionindexset needs to be updated regardless of forceshowsegment */
        this.selectedRegionIndexSet = !prevParcellation || prevParcellation === selectedParcellation?
          new Set(regions.map(({ngId = defaultNgId, labelIndex}) => generateLabelIndexId({ ngId, labelIndex }))) : new Set()

        if ( forceShowSegment === false || (forceShowSegment === null && hideSegmentFlag) ) {
          this.nehubaViewer.hideAllSeg()
          return
        }

        this.selectedRegionIndexSet.size > 0 && !overwrittenColorMap
          ? this.nehubaViewer.showSegs([...this.selectedRegionIndexSet])
          : this.nehubaViewer.showAllSeg()

        prevParcellation = selectedParcellation
      }),
    )

    this.subscriptions.push(
      this.ngLayers$.subscribe(ngLayersInterface => {
        if (!this.nehubaViewer) { return }

        const newLayers = ngLayersInterface.layers.filter(l => this.ngLayersRegister.layers?.findIndex(ol => ol.name === l.name) < 0)
        const removeLayers = this.ngLayersRegister.layers.filter(l => ngLayersInterface.layers?.findIndex(nl => nl.name === l.name) < 0)

        if (newLayers?.length > 0) {
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

        if (removeLayers?.length > 0) {
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

    this.subscriptions.push(
      this.selectedParcellation$.subscribe(this.handleParcellation.bind(this))
    )

    /* setup init view state */

    this.subscriptions.push(
      this.selectedRegions$.pipe(
        filter(() => !!this.nehubaViewer),
      ).subscribe(regions => {
        this.nehubaViewer.initRegions = regions.map(({ ngId, labelIndex }) => generateLabelIndexId({ ngId, labelIndex }))
      })
    )

    this.subscriptions.push(this.selectedRegions$.subscribe(sr => {
      this.selectedRegions = sr
    }))

    /** switch side nav */
    this.subscriptions.push(
      this.alwaysHideMinorPanel$.pipe(
        distinctUntilChanged()
      ).subscribe(flag => {
        if (!flag) {
          this.matDrawerMinor && this.matDrawerMinor.open()
          this.navSideDrawerMainSwitch && this.navSideDrawerMainSwitch.open()
        }
      })
    )

    this.subscriptions.push(
      this.selectedRegions$.subscribe(regions => {
        this.selectedRegions = regions
      })
    )

    /* handler to open/select landmark */
    const clickObs$ = fromEvent(this.elementRef.nativeElement, 'click')

    this.subscriptions.push(
      clickObs$.pipe(
        buffer(
          clickObs$.pipe(
            debounceTime(200),
          ),
        ),
        filter(arr => arr?.length >= 2),
      )
        .subscribe(() => {
          const { currentOnHover } = this
          this.store.dispatch(viewerStateDblClickOnViewer({
            payload: { ...currentOnHover }
          }))
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

  private currOnHoverObsSub: Subscription
  public ngOnChanges() {
    this.currOnHoverObsSub && this.currOnHoverObsSub.unsubscribe()
    if (this.currentOnHoverObs$) {
      this.currOnHoverObsSub = this.currentOnHoverObs$.subscribe(({ segments }) => this.onHoverSegments$.next(segments))
    }
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public toggleMaximiseMinimise(index: number) {
    this.store.dispatch(ngViewerActionToggleMax({
      payload: { index }
    }))
  }

  public tunableMobileProperties: ITunableProp[] = []


  public selectedProp = null

  public returnTruePos(quadrant: number, data: any) {
    const pos = quadrant > 2
      ? [0, 0, 0]
      : this.nanometersToOffsetPixelsFn && this.nanometersToOffsetPixelsFn[quadrant]
        ? this.nanometersToOffsetPixelsFn[quadrant](data.geometry.position.map(n => n * 1e6))
        : [0, 0, 0]
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

  public handleMouseEnterCustomLandmark(lm) {
    this.store.dispatch(
      viewerStateMouseOverCustomLandmark({
        payload: { userLandmark: lm }
      })
    )
  }

  public handleMouseLeaveCustomLandmark(lm) {
    this.store.dispatch(
      viewerStateMouseOverCustomLandmark({
        payload: { userLandmark: null }
      })
    )
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
    this.setViewerHandle && this.setViewerHandle(null)
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
    const viewerHandle = {
      setNavigationLoc : (coord, realSpace?) => this.nehubaViewer.setNavigationState({
        position : coord,
        positionReal : typeof realSpace !== 'undefined' ? realSpace : true,
      }),
      /* TODO introduce animation */
      moveToNavigationLoc : (coord, realSpace?) => {
        this.store.dispatch({
          type: CHANGE_NAVIGATION,
          navigation: {
            position: coord,
            animation: {},
          },
        })
      },
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

        this.store.dispatch(viewerStateAddUserLandmarks({
          landmarks
        }))
      },
      remove3DLandmarks : landmarkIds => {
        this.store.dispatch(viewreStateRemoveUserLandmarks({
          payload: { landmarkIds }
        }))
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
        this.store.dispatch(viewerStateSelectRegionWithIdDeprecated({
          selectRegionIds
        }))
      },
      hideAllSegments : () => {
        this.store.dispatch(viewerStateSelectRegionWithIdDeprecated({
          selectRegionIds: []
        }))
      },
      segmentColourMap : new Map(),
      getLayersSegmentColourMap: () => {
        const newMainMap = new Map()
        for (const [key, colormap] of this.nehubaViewer.multiNgIdColorMap.entries()) {
          const newColormap = new Map()
          newMainMap.set(key, newColormap)

          for (const [lableIndex, entry] of colormap.entries()) {
            newColormap.set(lableIndex, JSON.parse(JSON.stringify(entry)))
          }
        }
        return newMainMap
      },
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
        tap(() => console.warn('mouseOverNehuba observable is becoming deprecated. use mouseOverNehubaLayers instead.')),
      ),
      mouseOverNehubaLayers: this.onHoverSegments$,
      mouseOverNehubaUI: this.currentOnHoverObs$.pipe(
        map(({ landmark, segments, userLandmark: customLandmark }) => ({ segments, landmark, customLandmark })),
        shareReplay(1),
      ),
      getNgHash : this.nehubaViewer.getNgHash,
    }

    this.setViewerHandle && this.setViewerHandle(viewerHandle)
  }

  public setOctantRemoval(octantRemovalFlag: boolean) {
    this.store.dispatch(
      ngViewerActionSetPerspOctantRemoval({
        octantRemovalFlag
      })
    )
  }

  public zoomNgView(panelIndex: number, factor: number) {
    const ngviewer = this.nehubaViewer?.nehubaViewer?.ngviewer
    if (!ngviewer) throw new Error(`ngviewer not defined!`)

    /**
     * panelIndex < 3 === slice view
     */
    if (panelIndex < 3) {
      /**
       * factor > 1 === zoom out
       */
      ngviewer.navigationState.zoomBy(factor)
    } else {
      ngviewer.perspectiveNavigationState.zoomBy(factor)
    }
  }

  public clearPreviewingDataset(id: string){
    /**
     * clear all preview
     */
    this.store.dispatch(
      id
        ? uiActionHideDatasetWithId({ id })
        : uiActionHideAllDatasets()
    )
  }
}
