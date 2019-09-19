import { Component, Input } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { DatabrowserService } from "../../databrowser.service";
import { KgSingleDatasetService } from "../../kgSingleDatasetService.service";

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
    private singleKgDsService:KgSingleDatasetService,
  ){

  }

  get isShowing(){
    return this.singleKgDsService.ngLayers.has(this.previewFile.url)
  }

  showDedicatedView(){
    this.singleKgDsService.showNewNgLayer({ url: this.previewFile.url })
  }

  removeDedicatedView(){
    this.singleKgDsService.removeNgLayer({ url: this.previewFile.url })
  }
  
  click(event:MouseEvent){
    event.preventDefault()
    this.isShowing
      ? this.removeDedicatedView()
      : this.showDedicatedView()
  }
}
