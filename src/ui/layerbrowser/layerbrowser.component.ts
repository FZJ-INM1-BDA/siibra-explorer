import { Component, Input, OnDestroy } from "@angular/core";
import { AtlasViewerLayerInterface } from "../../util/pipes/newViewerDistinctViewToLayer.pipe";
import { Observable, Subscription } from "rxjs";
import { isDefined, ViewerStateInterface } from "../../services/stateStore.service";
import { Store, select } from "@ngrx/store";
import { filter, delay, distinctUntilChanged } from "rxjs/operators";


@Component({
  selector : 'layer-browser',
  templateUrl : './layerbrowser.template.html',
  styleUrls : [ './layerbrowser.style.css' ]
})

export class LayerBrowser implements OnDestroy{
  @Input() layers : AtlasViewerLayerInterface[] = []

  ngLayers : NgLayerInterface[] = []
  newViewer$ : Observable<any>
  subscription : Subscription
  disposeHandler : any

  constructor(private store : Store<ViewerStateInterface>){
    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state) && isDefined(state.templateSelected)),
      distinctUntilChanged((o,n) => o.templateSelected.name === n.templateSelected.name)
    )

    this.subscription = this.newViewer$.pipe(
      delay(0)
    ).subscribe(() => {
      this.layerChangedHandler()
      this.disposeHandler = window['viewer'].layerManager.layersChanged.add(() => this.layerChangedHandler())
      window['viewer'].registerDisposer(this.disposeHandler)
    })
  }

  ngOnDestroy(){
    this.disposeHandler()
    this.subscription.unsubscribe()
  }

  layerChangedHandler(){
    console.log('handle layer change',window['viewer'].layerManager.managedLayers)

    this.ngLayers = (window['viewer'].layerManager.managedLayers as any[]).map(obj => ({
      name : obj.name,
      type : obj.initialSpecification.type,
      source : obj.sourceUrl,
      visible : obj.visible
    }) as NgLayerInterface)
    
  }

  public muteClass(layer:AtlasViewerLayerInterface):boolean{
    if(this.layers.length === 0)
      return false
    return layer.type === 'mixable'
      ? this.layers.some(l => l.type === 'nonmixable')
      : false
  }

  public classVisible(layer:NgLayerInterface):boolean{
    return typeof layer.visible === 'undefined'
      ? true
      : layer.visible
  }
}

interface NgLayerInterface{
  name : string
  visible : boolean
  source : string
  type : string // image | segmentation | etc ...
  transform? : [[number, number, number, number],[number, number, number, number],[number, number, number, number],[number, number, number, number]] | null
  // colormap : string
}
