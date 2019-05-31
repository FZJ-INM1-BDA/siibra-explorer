import { Component, Input } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { DatabrowserService } from "../../databrowser.service";

@Component({
  selector : 'dedicated-viewer',
  templateUrl : './dedicated.template.html',
  styleUrls : [
    `./dedicated.style.css`
  ]
})

export class DedicatedViewer{
  @Input() previewFile : ViewerPreviewFile

  constructor(
    private dbService:DatabrowserService,
  ){

  }

  get isShowing(){
    return this.dbService.ngLayers.has(this.previewFile.url)
  }

  showDedicatedView(){
    this.dbService.showNewNgLayer({ url: this.previewFile.url })
  }

  removeDedicatedView(){
    this.dbService.removeNgLayer({ url: this.previewFile.url })
  }
  
  click(event:MouseEvent){
    event.preventDefault()
    this.isShowing
      ? this.removeDedicatedView()
      : this.showDedicatedView()
  }

  get tooltipText(){
    return this.isShowing
      ? 'Remove this file in the viewer'
      : 'View this file in the viewer'
  }
}