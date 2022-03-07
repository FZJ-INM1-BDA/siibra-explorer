import { ChangeDetectionStrategy, Component,  EventEmitter, Input, OnDestroy, OnInit, Output, Pipe, PipeTransform } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith } from "rxjs/operators";
import { MatSliderChange } from "@angular/material/slider";

import { getViewer } from "src/util/fn";
import { PureContantService } from "src/util";
import { ngViewerActionRemoveNgLayer, ngViewerActionForceShowSegment } from "src/services/state/ngViewerState/actions";
import { getNgIds } from 'src/util/fn'
import { LoggingService } from "src/logging";
import { ARIA_LABELS } from 'common/constants'

import { INgLayerInterface } from "../index";

const SHOW_LAYER_NAMES = [
  'PLI Fiber Orientation Red Channel',
  'PLI Fiber Orientation Green Channel',
  'PLI Fiber Orientation Blue Channel',
  'Blockface Image',
  'PLI Transmittance',
  'T2w MRI',
  'MRI Labels',
  '1um'
]

@Component({
  selector : 'layer-browser',
  templateUrl : './layerbrowser.template.html',
  styleUrls : [
    './layerbrowser.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LayerBrowser implements OnInit, OnDestroy {

  public TOGGLE_SHOW_LAYER_CONTROL_ARIA_LABEL = ARIA_LABELS.TOGGLE_SHOW_LAYER_CONTROL

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

  @Input()
  public showPlaceholder: boolean = true

  public darktheme$: Observable<boolean>

  private customNgLayers: string[] = ['spatial landmark layer']

  constructor(
    private store: Store<any>,
    private pureConstantSvc: PureContantService,
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
        return loadedNgLayers.filter(l => SHOW_LAYER_NAMES.includes(l.name))
      }),
      distinctUntilChanged()
    )

    this.forceShowSegment$ = this.store.pipe(
      select('ngViewerState'),
      select('forceShowSegment'),
      startWith(false)
    )

    this.darktheme$ = this.pureConstantSvc.darktheme$.pipe(
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

  get viewer() {
    return getViewer()
  }

  public toggleVisibility(layer: any) {
    const layerName = layer.name
    if (!layerName) {
      this.log.error('layer name not defined', layer)
      return
    }
    const ngLayer = this.viewer.layerManager.getLayerByName(layerName)
    if (!ngLayer) {
      this.log.error('ngLayer could not be found', layerName, this.viewer.layerManager.managedLayers)
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
    this.store.dispatch(
      ngViewerActionForceShowSegment({
        forceShowSegment : this.forceShowSegmentCurrentState === null
          ? true
          : this.forceShowSegmentCurrentState === true
            ? false
            : null,
      })
    )
  }

  public removeLayer(layer: any) {
    if (this.checkLocked(layer)) {
      this.log.warn('this layer is locked and cannot be removed')
      return
    }

    this.store.dispatch(
      ngViewerActionRemoveNgLayer({
        layer
      })
    )
  }

  public changeOpacity(layerName: string, event: MatSliderChange){
    const { value } = event
    const l = this.viewer.layerManager.getLayerByName(layerName)
    if (!l) return

    if (typeof l.layer.opacity === 'object') {
      l.layer.opacity.value = value
    } else if (typeof l.layer.displayState === 'object') {
      l.layer.displayState.selectedAlpha.value = value
    } else {
      this.log.warn({
        msg: `layer does not belong anywhere`,
        layerName,
        layer: l
      })
    }
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

@Pipe({
  name: 'getInitialLayerOpacityPipe'
})

export class GetInitialLayerOpacityPipe implements PipeTransform{
  public transform(viewer: any, layerName: string): number{
    if (!viewer) return 0
    const l = viewer.layerManager.getLayerByName(layerName)
    if (!l || !l.layer) return 0
    if (typeof l.layer.opacity === 'object') return l.layer.opacity.value
    else if (typeof l.layer.displayState === 'object') return l.layer.displayState.selectedAlpha.value
    else return 0
  }
}
