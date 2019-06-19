import { Component,  OnDestroy } from "@angular/core";
import { NgLayerInterface } from "../../atlasViewer/atlasViewer.component";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, REMOVE_NG_LAYER, FORCE_SHOW_SEGMENT, safeFilter, getNgIds } from "../../services/stateStore.service";
import { Subscription, Observable } from "rxjs";
import { filter, distinctUntilChanged, map, delay, buffer } from "rxjs/operators";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";

@Component({
  selector : 'layer-browser',
  templateUrl : './layerbrowser.template.html',
  styleUrls : [ 
    './layerbrowser.style.css',
    '../btnShadow.style.css'
  ]
})

export class LayerBrowser implements OnDestroy{

  /**
   * TODO make untangle nglayernames and its dependency on ng
   */
  ngLayers : NgLayerInterface[] = []
  lockedLayers : string[] = []

  public forceShowSegmentCurrentState : boolean | null = null
  public forceShowSegment$ : Observable<boolean|null>
  
  public ngLayers$: Observable<any>
  public advancedMode: boolean = false

  private subscriptions : Subscription[] = []
  private disposeHandler : any
  
  /* TODO temporary measure. when datasetID can be used, will use  */
  public fetchedDataEntries$ : Observable<any>

  constructor(
    private store : Store<ViewerStateInterface>,
    private constantsService: AtlasViewerConstantsServices){

    this.ngLayers$ = store.pipe(
      select('viewerState'),
      select('templateSelected'),
      map(templateSelected => {
        if (!templateSelected) return []
        if (this.advancedMode) return []
        return [
          templateSelected.ngId,
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


    /**
     * TODO leakage? after change of template still hanging the reference?
     */
    this.subscriptions.push(
      this.store.pipe(
        select('viewerState'),
        select('templateSelected'),
        distinctUntilChanged((o,n) => o.templateSelected.name === n.templateSelected.name),
        filter(templateSelected => !!templateSelected),
        map(templateSelected => Object.keys(templateSelected.nehubaConfig.dataset.initialNgState.layers)),
        buffer(this.store.pipe(
          select('ngViewerState'),
          select('nehubaReady'),
          filter(flag => flag)
        )),
        delay(0),
        map(arr => arr[arr.length - 1])
      ).subscribe((lockedLayerNames:string[]) => {
        /**
         * TODO
         * if layerbrowser is init before nehuba
         * window['viewer'] will return undefined
         */
        this.lockedLayers = lockedLayerNames

        this.ngLayersChangeHandler()
        this.disposeHandler = window['viewer'].layerManager.layersChanged.add(() => this.ngLayersChangeHandler())
        window['viewer'].registerDisposer(this.disposeHandler)
      })
    )

    this.subscriptions.push(
      this.forceShowSegment$.subscribe(state => this.forceShowSegmentCurrentState = state)
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  ngLayersChangeHandler(){
    this.ngLayers = (window['viewer'].layerManager.managedLayers as any[]).map(obj => ({
      name : obj.name,
      type : obj.initialSpecification.type,
      source : obj.sourceUrl,
      visible : obj.visible
    }) as NgLayerInterface)
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
    }else
      return this.lockedLayers.findIndex(l => l === ngLayer.name) >= 0
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
}
