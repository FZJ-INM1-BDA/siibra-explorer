import { Component, Input } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { KgSingleDatasetService } from "../../kgSingleDatasetService.service";

@Component({
  selector : 'dedicated-viewer',
  templateUrl : './dedicated.template.html',
  styleUrls : [
    `./dedicated.style.css`,
  ],
})

export class DedicatedViewer {
  @Input() public previewFile: ViewerPreviewFile

  constructor(
    private singleKgDsService: KgSingleDatasetService,
  ) {

  }

  get isShowing() {
    return this.singleKgDsService.ngLayers.has(this.previewFile.url)
  }

  public showDedicatedView() {
    this.singleKgDsService.showNewNgLayer({ url: this.previewFile.url })
  }

  public removeDedicatedView() {
    this.singleKgDsService.removeNgLayer({ url: this.previewFile.url })
  }

  public click(event: MouseEvent) {
    event.preventDefault()
    this.isShowing
      ? this.removeDedicatedView()
      : this.showDedicatedView()
  }
}
