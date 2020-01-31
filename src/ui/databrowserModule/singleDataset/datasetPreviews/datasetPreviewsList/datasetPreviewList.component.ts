import { Component, Input, ChangeDetectorRef, Output, EventEmitter, Pipe, PipeTransform } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { Store, select } from "@ngrx/store";
import { IavRootStoreInterface } from "src/services/stateStore.service";
import { Observable } from "rxjs";
import { DS_PREVIEW_URL } from 'src/util/constants'

@Component({
  selector: 'dataset-preview-list',
  templateUrl: './datasetPreviewList.template.html'
})

export class DatasetPreviewList{

  @Output() public previewingFile: EventEmitter<ViewerPreviewFile> = new EventEmitter()

  public datasetPreviewList: any[] = []
  public loadingDatasetPreviewList: boolean = false
  public selectedTemplateSpace$: Observable<any>

  constructor(
    private cdr: ChangeDetectorRef,
    store$: Store<IavRootStoreInterface>
  ){
    this.selectedTemplateSpace$ = store$.pipe(
      select('viewerState'),
      select('templateSelected')
    )
  }

  @Input()
  kgId: string

  public DS_PREVIEW_URL = DS_PREVIEW_URL

  handleKgDsPrvUpdated(event: CustomEvent){
    const { detail } = event
    const { datasetFiles, loadingFlag } = detail

    this.loadingDatasetPreviewList = loadingFlag
    this.datasetPreviewList = datasetFiles

    this.cdr.markForCheck()
  }
  public handlePreviewFile(file: ViewerPreviewFile) {
    
    this.previewingFile.emit(file)
  }
}

@Pipe({
  name: 'unavailableTooltip'
})

export class UnavailableTooltip implements PipeTransform{
  public transform(file: ViewerPreviewFile): string{
    if (file.referenceSpaces.length === 0) return `This preview is not available to be viewed in any reference space.`
    else return `This preview is available in the following reference space: ${file.referenceSpaces.map(({ name }) => name).join(', ')}`
  }
}