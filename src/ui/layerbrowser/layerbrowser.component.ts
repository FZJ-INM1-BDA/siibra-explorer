import { Component, Input, Output, EventEmitter } from "@angular/core";
import { NgLayerInterface } from "../../atlasViewer/atlasViewer.component";

@Component({
  selector : 'layer-browser',
  templateUrl : './layerbrowser.template.html',
  styleUrls : [ './layerbrowser.style.css' ]
})

export class LayerBrowser {

  @Input() ngLayers : NgLayerInterface[] = []
  @Input() lockedLayers : string[] = []

  @Output() removeLayerEmitter : EventEmitter<string> = new EventEmitter()

  public classVisible(layer:any):boolean{
    return typeof layer.visible === 'undefined'
      ? true
      : layer.visible
  }

  checkLocked(ngLayer:NgLayerInterface):boolean{
    if(!this.lockedLayers){
      /* locked layer undefined. always return true for locked layer check */
      return true
    }else
      return this.lockedLayers.findIndex(l => l === ngLayer.name) >= 0
  }

  removeLayer(layer:any){
    if(this.checkLocked(layer)){
      console.warn('this layer is locked and cannot be removed')
    }else{
      console.log(layer)
      // this.removeLayerEmitter.emit()
    }
  }
}
