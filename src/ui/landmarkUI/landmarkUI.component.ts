import { Component, Input, OnChanges, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, AfterContentChecked } from "@angular/core";
import { IDataEntry } from "src/services/stateStore.service"; 
import { GetKgSchemaIdFromFullIdPipe } from 'src/ui/databrowserModule/util/getKgSchemaIdFromFullId.pipe'
import { AtlasViewerConstantsServices } from "../databrowserModule/singleDataset/singleDataset.base";
import { Observable } from "rxjs";
import { DS_PREVIEW_URL } from 'src/util/constants'

@Component({
  selector: 'landmark-ui',
  templateUrl: './landmarkUI.template.html',
  styleUrls: [
    './landmarkUI.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LandmarkUIComponent implements OnChanges, AfterContentChecked{
  @Input() name: string
  @Input() fullId: string
  @Input() datasets: Partial<IDataEntry>[]

  @Output() relayout: EventEmitter<any> = new EventEmitter()

  private pipe = new GetKgSchemaIdFromFullIdPipe()

  public DS_PREVIEW_URL = DS_PREVIEW_URL

  public previewFilesMap: Map<string, any[]> = new Map()
  public previewFiles: any[] = []

  handleKgDsPrvUpdate(event: CustomEvent, datasetKgId: string){
    const { detail } = event
    const { datasetFiles } = detail

    this.previewFilesMap.set(datasetKgId, datasetFiles)

    this.previewFiles = []

    for (const [datasetKgId, previewFiles] of Array.from(this.previewFilesMap)){
      for (const singlePreviewFile of previewFiles){
        this.previewFiles.push({
          ...singlePreviewFile,
          datasetKgId
        })
      }
    }
    this.cdr.markForCheck()
  }

  public filterCriteria: string
  ngOnChanges(){
    this.filterCriteria = null
    if (!this.fullId) return
    const [kgSchema, kgId] = this.pipe.transform(this.fullId)
    this.filterCriteria = JSON.stringify([ `${kgSchema}/${kgId}` ])
  }

  // TODO need to optimise this. This calls way too frequently.
  ngAfterContentChecked(){
    this.relayout.emit()
  }

  public darktheme$: Observable<boolean>

  constructor(
    constantService: AtlasViewerConstantsServices,
    private cdr: ChangeDetectorRef
  ){
    this.darktheme$ = constantService.darktheme$
  }
}