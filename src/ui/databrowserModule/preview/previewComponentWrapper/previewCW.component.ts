import { Component, Input, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AtlasViewerConstantsServices } from "../../singleDataset/singleDataset.base";
import { Observable } from "rxjs";

@Component({
  templateUrl: './previewCW.template.html',
  styleUrls: [
    './previewCW.style.css'
  ]
})

export class PreviewComponentWrapper{

  public darktheme$: Observable<boolean>

  @Input()
  filename: string

  @Input()
  kgId: string

  @Input()
  backendUrl: string

  @Input()
  datasetName: string

  constructor(
    @Inject(MAT_DIALOG_DATA) data: any,
    private constantService: AtlasViewerConstantsServices
  ){

    this.darktheme$ = this.constantService.darktheme$
    if (data) {
      const { filename, kgId, backendUrl, datasetName } = data
      this.filename = filename
      this.kgId = kgId
      this.backendUrl = backendUrl
      this.datasetName = datasetName
    }
  }
}