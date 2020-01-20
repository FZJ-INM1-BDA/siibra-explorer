import { Component,  EventEmitter, Input, OnDestroy, OnInit, Output, Pipe, PipeTransform } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, shareReplay } from "rxjs/operators";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { LoggingService } from "src/services/logging.service";
import { NG_VIEWER_ACTION_TYPES } from "src/services/state/ngViewerState.store";
import { getViewer } from "src/util/fn";
import { INgLayerInterface } from "../../atlasViewer/atlasViewer.component";
import { FORCE_SHOW_SEGMENT, getNgIds, isDefined, REMOVE_NG_LAYER, safeFilter, ViewerStateInterface } from "../../services/stateStore.service";

@Component({
  selector : 'layer-browser',
  templateUrl : './layerbrowser.template.html',
  styleUrls : [
    './layerbrowser.style.css',
    '../btnShadow.style.css',
  ],
})

export class LayerBrowser implements OnInit, OnDestroy {

  @Output() public nonBaseLayersChanged: EventEmitter<INgLayerInterface[]> = new EventEmitter()

  /**
   * TODO make untangle nglayernames and its dependency on ng
   */
  public loadedNgLayers$: Observable<INgLayerInterface[]>
  public lockedLayers: string[] = []

  public nonBaseNgLayers$: Observable<INgLayerInterface[]>

  public forceShowSegmentCurrentState: boolean | null = null
  public forceShowSegment$: Observable<boolean|null>

  public ngLayers$: Observable<string[]>
  public advancedMode: boolean = false

  private subscriptions: Subscription[] = []
  private disposeHandler: any

  /* TODO temporary measure. when datasetID can be used, will use  */
  public fetchedDataEntries$: Observable<any>

  @Input()
  public showPlaceholder: boolean = true

  public darktheme$: Observable<boolean>

  private customNgLayers: string[] = ['spatial landmark layer']

  constructor(
    private store: Store<ViewerStateInterface>,
    private constantsService: AtlasViewerConstantsServices,
    private log: LoggingService,
  ) {

    this.ngLayers$ = store.pipe(
      select('viewerState'),
      select('templateSelected'),
      map(templateSelected => {
        if (!templateSelected) { return [] }
        if (this.advancedMode) { return [] }

        const { ngId , otherNgIds = []} = templateSelected

        return [
          ngId,
          ...this.customNgLayers,
          ...otherNgIds,
          ...templateSelected.parcellations.reduce((acc, curr) => {
            return acc.concat([
              curr.ngId,
              ...getNgIds(curr.regions),
            ])
          }, []),
        ]
      }),
      /**
       * get unique array
       */
      map(nonUniqueArray => Array.from(new Set(nonUniqueArray))),
      /**
       * remove falsy values
       */
      map(arr => arr.filter(v => !!v)),
    )

    this.loadedNgLayers$ = this.store.pipe(
      select('viewerState'),
      select('loadedNgLayers'),
    )

    this.nonBaseNgLayers$ = combineLatest(
      this.ngLayers$,
      this.loadedNgLayers$,
    ).pipe(
      map(([baseNgLayerNames, loadedNgLayers]) => {
        const baseNameSet = new Set(baseNgLayerNames)
        return loadedNgLayers.filter(l => !baseNameSet.has(l.name))
      }),
      distinctUntilChanged(),
    )

    /**
     * TODO
     * this is no longer populated
     */
    this.fetchedDataEntries$ = this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedDataEntries'),
      map(v => v.fetchedDataEntries),
    )

    this.forceShowSegment$ = this.store.pipe(
      select('ngViewerState'),
      filter(state => isDefined(state) && typeof state.forceShowSegment !== 'undefined'),
      map(state => state.forceShowSegment),
    )

    this.darktheme$ = this.constantsService.darktheme$.pipe(
      shareReplay(1),
    )

  }

  public ngOnInit() {
    this.subscriptions.push(
      this.nonBaseNgLayers$.pipe(
        // on switching template, non base layer will fire
        // debounce to ensure that the non base layer is indeed an extra layer
        debounceTime(160),
      ).subscribe(layers => this.nonBaseLayersChanged.emit(layers)),
    )
    this.subscriptions.push(
      this.forceShowSegment$.subscribe(state => this.forceShowSegmentCurrentState = state),
    )
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public classVisible(layer: any): boolean {
    return typeof layer.visible === 'undefined'
      ? true
      : layer.visible
  }

  public checkLocked(ngLayer: INgLayerInterface): boolean {
    if (!this.lockedLayers) {
      /* locked layer undefined. always return false */
      return false
    } else {
      return this.lockedLayers.findIndex(l => l === ngLayer.name) >= 0
    }
  }

  public toggleVisibility(layer: any) {
    const viewer = getViewer()
    const layerName = layer.name
    if (!layerName) {
      this.log.error('layer name not defined', layer)
      return
    }
    const ngLayer = viewer.layerManager.getLayerByName(layerName)
    if (!ngLayer) {
      this.log.error('ngLayer could not be found', layerName, viewer.layerManager.managedLayers)
    }
    ngLayer.setVisible(!ngLayer.visible)
  }

  public toggleForceShowSegment(ngLayer: any) {
    if (!ngLayer || ngLayer.type !== 'segmentation') {
      /* toggle only on segmentation layer */
      return
    }

    /**
     * TODO perhaps useEffects ?
     */
    this.store.dispatch({
      type : FORCE_SHOW_SEGMENT,
      forceShowSegment : this.forceShowSegmentCurrentState === null
        ? true
        : this.forceShowSegmentCurrentState === true
          ? false
          : null,
    })
  }

  public removeAllNonBasicLayer() {
    this.store.dispatch({
      type: NG_VIEWER_ACTION_TYPES.REMOVE_ALL_NONBASE_LAYERS,
    })
  }

  public removeLayer(layer: any) {
    if (this.checkLocked(layer)) {
      this.log.warn('this layer is locked and cannot be removed')
      return
    }
    this.store.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : layer.name,
      },
    })
  }

  /**
   * TODO use observable and pipe to make this more perf
   */
  public segmentationTooltip() {
    return `toggle segments visibility:
    ${this.forceShowSegmentCurrentState === true ? 'always show' : this.forceShowSegmentCurrentState === false ? 'always hide' : 'auto'}`
  }

  get segmentationAdditionalClass() {
    return this.forceShowSegmentCurrentState === null
      ? 'blue'
      : this.forceShowSegmentCurrentState === true
        ? 'normal'
        : this.forceShowSegmentCurrentState === false
          ? 'muted'
          : 'red'
  }

  public matTooltipPosition: string = 'below'
}

@Pipe({
  name: 'lockedLayerBtnClsPipe',
})

export class LockedLayerBtnClsPipe implements PipeTransform {
  public transform(ngLayer: INgLayerInterface, lockedLayers?: string[]): boolean {
    return (lockedLayers && new Set(lockedLayers).has(ngLayer.name)) || false
  }
}
