import { Input, OnInit, ChangeDetectorRef, TemplateRef, Output, EventEmitter } from "@angular/core";
import { KgSingleDatasetService } from "../kgSingleDatasetService.service";
import { Publication, File, DataEntry, ViewerPreviewFile } from 'src/services/state/dataStore.store'
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { DatabrowserService } from "../databrowser.service";
import { Observable } from "rxjs";

export {
  DatabrowserService,
  KgSingleDatasetService,
  ChangeDetectorRef,
  AtlasViewerConstantsServices
}

export class SingleDatasetBase implements OnInit {

  @Input() ripple: boolean = false

  /**
   * the name/desc/publications are placeholder/fallback entries
   * while the actual data is being loaded from KG with kgSchema and kgId
   */
  @Input() name?: string
  @Input() description?: string
  @Input() publications?: Publication[]

  @Input() kgSchema?: string
  @Input() kgId?: string

  @Input() dataset: any = null
  @Input() simpleMode: boolean = false

  @Output() previewingFile: EventEmitter<ViewerPreviewFile> = new EventEmitter()

  public preview: boolean = false
  private humanReadableFileSizePipe: HumanReadableFileSizePipe = new HumanReadableFileSizePipe()

  /**
   * sic!
   */
  private kgReference: string[] = []
  public files: File[] = []
  private methods: string[] = []
  /**
   * sic!
   */
  private parcellationRegion: { name: string }[]

  private error: string = null

  public fetchingSingleInfoInProgress = false
  public downloadInProgress = false

  public favedDataentries$: Observable<DataEntry[]>
  constructor(
    private dbService: DatabrowserService,
    private singleDatasetService: KgSingleDatasetService,
    private cdr: ChangeDetectorRef,
    private constantService: AtlasViewerConstantsServices
  ){
    this.favedDataentries$ = this.dbService.favedDataentries$
  }

  ngOnInit() {
    const { kgId, kgSchema, dataset } = this
    if ( dataset ) {
      const { name, description, kgReference, publications, files, preview, ...rest } = dataset
      this.name = name
      this.description = description
      this.kgReference = kgReference
      this.publications = publications
      this.files = files
      this.preview = preview
      
      return
    }
    if (!kgSchema || !kgId) return
    this.fetchingSingleInfoInProgress = true
    this.singleDatasetService.getInfoFromKg({
      kgId,
      kgSchema
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

  get numOfFiles(){
    return this.files
      ? this.files.length
      : null
  }

  get totalFileByteSize(){
    return this.files
      ? this.files.reduce((acc, curr) => acc + curr.byteSize, 0)
      : null
  }

  get tooltipText(){
    return `${this.numOfFiles} files ~ ${this.humanReadableFileSizePipe.transform(this.totalFileByteSize)}`
  }

  get showFooter(){
    return (this.kgReference && this.kgReference.length > 0)
      || (this.publications && this.publications.length > 0)
      || (this.files && this.files.length > 0)
  }

  toggleFav() {
    this.dbService.toggleFav(this.dataset)
  }

  showPreviewList(templateRef: TemplateRef<any>){
    this.singleDatasetService.showPreviewList(templateRef)
  }

  handlePreviewFile(file: ViewerPreviewFile){
    this.previewingFile.emit(file)
    this.singleDatasetService.previewFile(file, this.dataset)
  }

  stop(event:Event){
    event.stopPropagation()
  }
  
  downloadZipFromKg() {
    this.downloadInProgress = true
    this.cdr.markForCheck()

    const { kgId, kgSchema }  = this
    this.singleDatasetService.downloadZipFromKg({
      kgId,
      kgSchema
    }, this.name)
      .catch(err => this.constantService.catchError(err))
      .finally(() => {
        this.downloadInProgress = false
        this.cdr.markForCheck()
      })
  }
}
