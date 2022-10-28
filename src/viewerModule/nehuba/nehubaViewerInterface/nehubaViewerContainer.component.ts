import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: `sxplr-nehuba-viewer-container`,
  templateUrl: `./nehubaViewerContainer.template.html`,
  styleUrls: [`./nehubaViewerContainer.style.css`]
})

export class NehubaViewerContainer {
  handleViewerLoadedEvent(flag: boolean) {
    this.viewerLoaded.emit(flag)
  }

  @Output()
  viewerLoaded = new EventEmitter()
}
