import { ChangeDetectorRef, Input, OnInit, TemplateRef, OnChanges } from "@angular/core";
import { Observable } from "rxjs";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { IDataEntry, IFile, IPublication, ViewerPreviewFile } from 'src/services/state/dataStore.store'
import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { DatabrowserService } from "../databrowser.service";
import { KgSingleDatasetService } from "../kgSingleDatasetService.service";

import { DS_PREVIEW_URL } from 'src/util/constants'
import { getKgSchemaIdFromFullId } from "../util/getKgSchemaIdFromFullId.pipe";
import { MatSnackBar } from "@angular/material/snack-bar";

export {
  DatabrowserService,
  KgSingleDatasetService,
  ChangeDetectorRef,
  AtlasViewerConstantsServices
}

export class SingleDatasetBase implements OnInit, OnChanges {

  @Input() public ripple: boolean = false

  /**
   * the name/desc/publications are placeholder/fallback entries
   * while the actual data is being loaded from KG with kgSchema and kgId
   */
  @Input() public name?: string
  @Input() public description?: string
  @Input() public publications?: IPublication[]

  private _fullId: string

  @Input()
  set fullId(val){
    this._fullId = val
  }

  get fullId(){
    return this._fullId || (this.kgSchema && this.kgId && `${this.kgSchema}/${this.kgId}`) || null
  }

  @Input() public kgSchema?: string = 'minds/core/dataset/v1.0.0'
  @Input() public kgId?: string

  @Input() public dataset: any = null
  @Input() public simpleMode: boolean = false

  public preview: boolean = false
  private humanReadableFileSizePipe: HumanReadableFileSizePipe = new HumanReadableFileSizePipe()

  public DS_PREVIEW_URL = DS_PREVIEW_URL

  /**
   * sic!
   */
  public kgReference: string[] = []
  public files: IFile[] = []
  private methods: string[] = []

  private error: string = null

  public fetchingSingleInfoInProgress = false
  public downloadInProgress = false

  public dlFromKgHref: string = null

  public selectedTemplateSpace$: Observable<any>

  public favedDataentries$: Observable<IDataEntry[]>
  constructor(
    private dbService: DatabrowserService,
    private singleDatasetService: KgSingleDatasetService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    dataset?: any,
  ) {
    this.favedDataentries$ = this.dbService.favedDataentries$

    if (dataset) {
      const { fullId } = dataset
      const obj = getKgSchemaIdFromFullId(fullId)
      if (obj) {
        const [ kgSchema, kgId ] = obj
        this.kgSchema = kgSchema
        this.kgId = kgId
      }
    }
  }

  public hasPreview = false
  public previewFiles = []

  handleKgDsPrvUpdate(event: CustomEvent){
    this.hasPreview = false
    this.previewFiles = []
    const { detail } = event
    const { datasetFiles } = detail
    if (datasetFiles && Array.isArray(datasetFiles) && datasetFiles.length > 0) {
      this.hasPreview = true
      this.previewFiles = datasetFiles
    }
  }

  public async fetchDatasetDetail(){
    try {
      const { kgId } = this
      if (!kgId) return
      const dataset = await this.singleDatasetService.getInfoFromKg({ kgId })
      
      const { name, description, publications, fullId } = dataset
      this.name = name
      this.description = description
      this.publications = publications
      this.fullId = fullId

      this.cdr.detectChanges()
    } catch (e) {
      // catch error
    }
  }

  public ngOnChanges(){
    if (!this.kgId) {
      const fullId = this.fullId || this.dataset?.fullId
      
      const re = getKgSchemaIdFromFullId(fullId)
      if (re) {
        this.kgSchema = re[0]
        this.kgId = re[1]
      }
    }
    
    this.fetchDatasetDetail()
  }

  public ngOnInit() {
    const { kgId, kgSchema, dataset } = this
    this.dlFromKgHref = this.singleDatasetService.getDownloadZipFromKgHref({ kgSchema, kgId })
    if ( dataset ) {
      const { name, description, kgReference, publications, files, preview } = dataset
      this.name = name
      this.description = description
      this.kgReference = kgReference
      this.publications = publications
      this.files = files
      this.preview = preview

      return
    }
    if (!kgSchema || !kgId) { return }
    this.fetchingSingleInfoInProgress = true
    this.singleDatasetService.getInfoFromKg({
      kgId,
      kgSchema,
    })
      .then(json => {
        /**
         * TODO dataset specific
         */
        const { files, publications, name, description, kgReference} = json
        this.name = name
        this.description = description
        this.kgReference = kgReference
        this.publications = publications
        this.files = files

        this.dataset = json

        this.cdr.markForCheck()
      })
      .catch(e => {
        this.error = e
      })
      .finally(() => {
        this.fetchingSingleInfoInProgress = false
        this.cdr.markForCheck()
      })
  }

  get downloadEnabled() {
    return this.kgSchema && this.kgId
  }

  get numOfFiles() {
    return this.files
      ? this.files.length
      : null
  }

  get totalFileByteSize() {
    return this.files
      ? this.files.reduce((acc, curr) => acc + curr.byteSize, 0)
      : null
  }

  get tooltipText() {
    return `${this.numOfFiles} files ~ ${this.humanReadableFileSizePipe.transform(this.totalFileByteSize)}`
  }

  get showFooter() {
    return (this.kgReference && this.kgReference.length > 0)
      || (this.publications && this.publications.length > 0)
      || (this.files && this.files.length > 0)
  }

  public toggleFav() {
    this.dbService.toggleFav({ fullId: this.fullId })
  }

  public showPreviewList(templateRef: TemplateRef<any>) {
    this.singleDatasetService.showPreviewList(templateRef)
  }

  public handlePreviewFile(file: ViewerPreviewFile) {
    this.singleDatasetService.previewFile(file, this.dataset)
  }

  public undoableRemoveFav() {
    this.snackBar.open(`Unpinned dataset: ${this.name}`, 'Undo', {
      duration: 5000,
      politeness: "polite"
    })
      .afterDismissed()
      .subscribe(({ dismissedByAction }) => {
        if (dismissedByAction) {
          this.dbService.saveToFav({ fullId: this.fullId})
        }
      })
    this.dbService.removeFromFav({ fullId: this.fullId})
  }

  public undoableAddFav() {
    this.snackBar.open(`Pinned dataset: ${this.name}`, 'Undo', {
      duration: 5000,
      politeness: "polite"
    })
      .afterDismissed()
      .subscribe(({ dismissedByAction }) => {
        if (dismissedByAction) {
          this.dbService.removeFromFav({ fullId: this.fullId})
        }
      })
    this.dbService.saveToFav({ fullId: this.fullId})
  }
}
