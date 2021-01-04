import { Component, Input, OnChanges, SimpleChanges, ViewChild } from "@angular/core";
import { Store } from "@ngrx/store";
import { Subject } from "rxjs";
import { ngViewerActionAddNgLayer } from "src/services/state/ngViewerState/actions";
import { getNgIds, getMultiNgIdsRegionsLabelIndexMap } from "../constants";
import { IViewer, TViewerEvent } from "../../viewer.interface";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { NehubaViewerContainerDirective } from "../nehubaViewerInterface/nehubaViewerInterface.directive";

interface INgLayerInterface {
  name: string // displayName
  source: string
  mixability: string // base | mixable | nonmixable
  annotation?: string //
  id?: string // unique identifier
  visible?: boolean
  shader?: string
  transform?: any
}


@Component({
  selector: 'iav-cmp-viewer-nehuba-glue',
  templateUrl: './nehubaViewerGlue.template.html',
  styleUrls: [
    './nehubaViewerGlue.style.css'
  ]
})

export class NehubaGlueCmp implements IViewer, OnChanges{

  @ViewChild(NehubaViewerContainerDirective, { static: true })
  public nehubaContainerDirective: NehubaViewerContainerDirective

  public viewerEvents$ = new Subject<TViewerEvent>()

  private viewerUnit: NehubaViewerUnit
  private ngLayersRegister: {layers: INgLayerInterface[]} = {
    layers: []
  }
  private multiNgIdsRegionsLabelIndexMap: Map<string, Map<number, any>>

  @Input()
  public selectedParcellation: any

  @Input()
  public selectedTemplate: any

  ngOnChanges(sc: SimpleChanges){
    const {
      selectedParcellation,
      selectedTemplate
    } = sc
    if (selectedTemplate.currentValue !== selectedTemplate.previousValue) {
      this.loadTmpl(selectedTemplate.currentValue, selectedParcellation.currentValue)
    } else if (selectedParcellation.currentValue !== selectedParcellation.previousValue) {

    }
  }

  private loadParc(parcellation: any) {
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

    this.viewerUnit.multiNgIdsLabelIndexMap = this.multiNgIdsRegionsLabelIndexMap
    this.viewerUnit.auxilaryMeshIndices = parcellation.auxillaryMeshIndices || []

    /* TODO replace with proper KG id */
    /**
     * need to set unique array of ngIds, or else workers will be overworked
     */
    this.viewerUnit.ngIds = Array.from(new Set(ngIds))
  }

  private async loadTmpl(template: any, parcellation: any) {
    this.nehubaContainerDirective.createNehubaInstance(template)
    this.viewerUnit = this.nehubaContainerDirective.nehubaViewerInstance

    const foundParcellation = parcellation
      && template?.parcellations?.find(p => parcellation.name === p.name)
    this.loadParc(foundParcellation || template.parcellations[0])


    const nehubaConfig = template.nehubaConfig
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
  }

  constructor(
    private store: Store<any>
  ){
    this.viewerEvents$.next({
      type: 'MOUSEOVER_ANNOTATION',
      data: {}
    })
  }

  handleViewerLoadedEvent(flag: boolean) {
    this.viewerEvents$.next({
      type: 'VIEWERLOADED',
      data: flag
    })
  }

}