import { Component, Optional, Inject } from "@angular/core";
import { PreviewBase } from "../preview.base";
import { GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME } from "src/glue";

@Component({
  selector: 'preview-card',
  templateUrl: './previewCard.template.html',
  styleUrls: [
    './previewCard.style.css'
  ]
})

export class PreviewCardComponent extends PreviewBase {
  constructor(
    @Optional() @Inject(GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME) getDatasetPreviewFromId,
  ){
    super(getDatasetPreviewFromId)
  }
}