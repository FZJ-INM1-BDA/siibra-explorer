import { Directive, Input, HostListener, Inject, Output, EventEmitter, Optional, OnChanges, InjectionToken } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ViewerPreviewFile, IDataEntry } from 'src/services/state/dataStore.store'
import { Observable, Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { PreviewBase } from "./preview.base";
import { GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME } from "src/glue";

export const IAV_DATASET_PREVIEW_DATASET_FN = 'IAV_DATASET_PREVIEW_DATASET_FN'

// TODO consolidate type
export type TypePreviewDispalyed = (file, dataset) => Observable<boolean>
export const IAV_DATASET_PREVIEW_ACTIVE = new InjectionToken<TypePreviewDispalyed>('IAV_DATASET_PREVIEW_ACTIVE')

@Directive({
  selector: '[iav-dataset-preview-dataset-file]',
  exportAs: 'iavDatasetPreviewDatasetFile'
})

export class PreviewDatasetFile extends PreviewBase implements OnChanges{

  @Input('iav-dataset-preview-dataset-file')
  file: ViewerPreviewFile

  @Input('iav-dataset-preview-dataset-file-filename')
  filename: string
  
  @Input('iav-dataset-preview-dataset-file-dataset')
  dataset: IDataEntry

  @Input('iav-dataset-preview-dataset-file-kgid')
  set kgId(val) {
    this.datasetId = val
  }

  get kgId(){
    return this.datasetId
  }

  @Input('iav-dataset-preview-dataset-file-kgschema')
  kgSchema: string = `minds/core/dataset/v1.0.0`

  @Input('iav-dataset-preview-dataset-file-fullid')
  fullId: string

  @Output('iav-dataset-preview-dataset-file-emit')
  emitter: EventEmitter<{file: Partial<ViewerPreviewFile>, dataset: Partial<IDataEntry>}> = new EventEmitter()

  @Output('iav-dataset-preview-active-changed')
  active$: EventEmitter<boolean> = new EventEmitter()

  public active: boolean = false

  private dataActiveObs: Subscription
  constructor(
    private snackbar: MatSnackBar,
    @Optional() @Inject(IAV_DATASET_PREVIEW_DATASET_FN) private emitFn: any,
    @Optional() @Inject(IAV_DATASET_PREVIEW_ACTIVE) private getDatasetActiveObs: (file, dataset) => Observable<boolean>,
    @Optional() @Inject(GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME) getDatasetPreviewFromId,
  ){
    super(getDatasetPreviewFromId || null)
  }

  ngOnChanges(){
    super.ngOnChanges()
    if (this.dataActiveObs) this.dataActiveObs.unsubscribe()
    
    if (this.getDatasetActiveObs) this.dataActiveObs = this.getDatasetActiveObs(this.getFile(), this.getDataset()).pipe(
      distinctUntilChanged()
    ).subscribe(flag => {
      this.active = flag
      this.active$.emit(flag)
    })
  }

  private getFile(): Partial<ViewerPreviewFile>{
    if (!this.file && !this.filename) {
      return null
    }
    return this.file  || {
      filename: this.filename
    }
  }

  private getDataset(): Partial<IDataEntry>{
    return this.dataset || {
      fullId: this.fullId || (this.kgSchema && this.kgId && `${this.kgSchema}/${this.kgId}`) || null
    }
  }

  @HostListener('click')
  onClick(){
    const file = this.getFile()
    const dataset = this.getDataset()
    if (!file) {
      this.snackbar.open(`Cannot preview dataset file. Neither file nor filename are defined.`)
      return
    }
    if (this.emitFn) this.emitFn(file, dataset)
    this.emitter.emit({ file, dataset })
  }
}
