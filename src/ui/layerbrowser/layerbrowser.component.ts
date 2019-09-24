import { Component,  OnDestroy, Input, Pipe, PipeTransform, Output, EventEmitter, OnInit } from "@angular/core";
import { NgLayerInterface } from "../../atlasViewer/atlasViewer.component";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, REMOVE_NG_LAYER, FORCE_SHOW_SEGMENT, safeFilter, getNgIds } from "../../services/stateStore.service";
import { Subscription, Observable, combineLatest } from "rxjs";
import { filter, map, shareReplay, distinctUntilChanged } from "rxjs/operators";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";

@Component({
  selector : 'layer-browser',
  templateUrl : './layerbrowser.template.html',
  styleUrls : [ 
    './layerbrowser.style.css',
    '../btnShadow.style.css'
  ]
})

export class LayerBrowser implements OnInit, OnDestroy{

  @Output() nonBaseLayersChanged: EventEmitter<NgLayerInterface[]> = new EventEmitter() 

  /**
   * TODO make untangle nglayernames and its dependency on ng
   */
  public loadedNgLayers$: Observable<NgLayerInterface[]>
  public lockedLayers : string[] = []

  public nonBaseNgLayers$: Observable<NgLayerInterface[]>

  public forceShowSegmentCurrentState : boolean | null = null
  public forceShowSegment$ : Observable<boolean|null>
  
  public ngLayers$: Observable<string[]>
  public advancedMode: boolean = false

  private subscriptions : Subscription[] = []
  private disposeHandler : any
  
  /* TODO temporary measure. when datasetID can be used, will use  */
  public fetchedDataEntries$ : Observable<any>

  @Input()
  showPlaceholder: boolean = true

  darktheme$: Observable<boolean>

  constructor(
    private store : Store<ViewerStateInterface>,
    private constantsService: AtlasViewerConstantsServices){

    this.ngLayers$ = store.pipe(
      select('viewerState'),
      select('templateSelected'),
      map(templateSelected => {
        if (!templateSelected) return []
        if (this.advancedMode) return []

        const { ngId , otherNgIds = []} = templateSelected

        return [
          ngId,
          ...otherNgIds,
          ...templateSelected.parcellations.reduce((acc, curr) => {
            return acc.concat([
              curr.ngId,
              ...getNgIds(curr.regions)
            ])
          }, [])
        ]
      }),
      /**
       * get unique array
       */
      map(nonUniqueArray => Array.from(new Set(nonUniqueArray))),
      /**
       * remove falsy values
       */
      map(arr => arr.filter(v => !!v))
    )

    this.loadedNgLayers$ = this.store.pipe(
      select('viewerState'),
      select('loadedNgLayers')
    )

    this.nonBaseNgLayers$ = combineLatest(
      this.ngLayers$,
      this.loadedNgLayers$
    ).pipe(
      map(([baseNgLayerNames, loadedNgLayers]) => {
        const baseNameSet = new Set(baseNgLayerNames)
        return loadedNgLayers.filter(l => !baseNameSet.has(l.name))
      }),
      distinctUntilChanged()
    )

    /**
     * TODO
     * this is no longer populated
     */
    this.fetchedDataEntries$ = this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedDataEntries'),
      map(v=>v.fetchedDataEntries)
    )

    this.forceShowSegment$ = this.store.pipe(
      select('ngViewerState'),
      filter(state => isDefined(state) && typeof state.forceShowSegment !== 'undefined'),
      map(state => state.forceShowSegment)
    )


    this.darktheme$ = this.constantsService.darktheme$.pipe(
      shareReplay(1)
    )

  }

  ngOnInit(){
    this.subscriptions.push(
      this.nonBaseNgLayers$.subscribe(layers => this.nonBaseLayersChanged.emit(layers))
    )
    this.subscriptions.push(
      this.forceShowSegment$.subscribe(state => this.forceShowSegmentCurrentState = state)
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public classVisible(layer:any):boolean{
    return typeof layer.visible === 'undefined'
      ? true
      : layer.visible
  }

  checkLocked(ngLayer:NgLayerInterface):boolean{
    if(!this.lockedLayers){
      /* locked layer undefined. always return false */
      return false
    }else{
      return this.lockedLayers.findIndex(l => l === ngLayer.name) >= 0
    }
  }

  toggleVisibility(layer:any){
    const layerName = layer.name
    if(!layerName){
      console.error('layer name not defined', layer)
      return
    }
    const ngLayer = window['viewer'].layerManager.getLayerByName(layerName)
    if(!ngLayer){
      console.error('ngLayer could not be found', layerName, window['viewer'].layerManager.managedLayers)
    }
    ngLayer.setVisible(!ngLayer.visible)
  }

  toggleForceShowSegment(ngLayer:any){
    if(!ngLayer || ngLayer.type !== 'segmentation'){
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
          : null
    })
  }

  removeLayer(layer:any){
    if(this.checkLocked(layer)){
      console.warn('this layer is locked and cannot be removed')
      return
    }
    this.store.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : layer.name
      }
    })
  }

  /**
   * TODO use observable and pipe to make this more perf
   */
  segmentationTooltip(){
    return `toggle segments visibility: 
    ${this.forceShowSegmentCurrentState === true ? 'always show' : this.forceShowSegmentCurrentState === false ? 'always hide' : 'auto'}`
  }

  get segmentationAdditionalClass(){
    return this.forceShowSegmentCurrentState === null
      ? 'blue'
      : this.forceShowSegmentCurrentState === true
        ? 'normal'
        : this.forceShowSegmentCurrentState === false
          ? 'muted'
          : 'red' 
  }

  get isMobile(){
    return this.constantsService.mobile
  }

  public matTooltipPosition: string = 'below'
}

@Pipe({
  name: 'lockedLayerBtnClsPipe'
})

export class LockedLayerBtnClsPipe implements PipeTransform{
  public transform(ngLayer:NgLayerInterface, lockedLayers?: string[]): boolean{
    return (lockedLayers && new Set(lockedLayers).has(ngLayer.name)) || false
  }
}