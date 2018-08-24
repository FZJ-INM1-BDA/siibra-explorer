import { Component, Input } from "@angular/core";
import { AtlasViewerLayerInterface } from "../../util/pipes/newViewerDistinctViewToLayer.pipe";


@Component({
  selector : 'layer-browser',
  templateUrl : './layerbrowser.template.html',
  styleUrls : [ './layerbrowser.style.css' ]
})

export class LayerBrowser{
  @Input() layers : AtlasViewerLayerInterface[] = []

  public muteClass(layer:AtlasViewerLayerInterface):boolean{
    if(this.layers.length === 0)
      return false
    return layer.type === 'mixable'
      ? this.layers.some(l => l.type === 'nonmixable')
      : false
  }
}