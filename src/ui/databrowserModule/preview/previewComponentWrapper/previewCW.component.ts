import { Component, Input, Inject, ViewChild, ElementRef } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { Observable, fromEvent, Subscription, of, throwError } from "rxjs";
import { switchMapTo, catchError, take, concatMap, map, retryWhen, delay } from "rxjs/operators";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ARIA_LABELS } from 'common/constants'
import { DS_PREVIEW_URL } from 'src/util/constants'

const { 
  DOWNLOAD_PREVIEW,
  DOWNLOAD_PREVIEW_CSV
} = ARIA_LABELS

const fromPromiseRetry = ({ retries = 10, timeout = 100 } = {}) => {
  let retryCounter = 0
  return (fn: () => Promise<any>) => new Observable(obs => {
    retryCounter += 1
    fn()
      .then(val => obs.next(val))
      .catch(e => obs.error(e))
      .finally(() => obs.complete())
  }).pipe(
    
    retryWhen(err => {
      if (retryCounter >= retries) return throwError(err)
      return err.pipe(
        delay(timeout)
      )
    })
  )
}

@Component({
  templateUrl: './previewCW.template.html',
  styleUrls: [
    './previewCW.style.css'
  ]
})

export class PreviewComponentWrapper{

  public touched: boolean = false
  public untouchedIndex: number = 0

  public DOWNLOAD_PREVIEW_ARIA_LABEL = DOWNLOAD_PREVIEW
  public DOWNLOAD_PREVIEW_CSV_ARIA_LABEL = DOWNLOAD_PREVIEW_CSV

  private subscriptions: Subscription[] = []

  @ViewChild('dataPreviewerStencilCmp', { read: ElementRef, static: true })
  private dataPreviewerStencilCmp: ElementRef<any>

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
    private constantService: AtlasViewerConstantsServices,
    private sanitizer: DomSanitizer
  ){

    this.darktheme$ = this.constantService.darktheme$
    if (data) {
      const { filename, kgId, backendUrl, datasetName } = data
      this.filename = filename
      this.kgId = kgId
      this.backendUrl = backendUrl
      this.datasetName = datasetName
    }

    this.backendUrl = this.backendUrl || DS_PREVIEW_URL
  }

  public downloadHref: SafeResourceUrl
  public downloadCsvHref: SafeResourceUrl

  ngAfterViewInit(){
    this.dataPreviewerStencilCmp.nativeElement.getDownloadPreviewHref()

    const hydrateHrefSubscription = fromEvent(this.dataPreviewerStencilCmp.nativeElement, 'renderEvent').pipe(
      switchMapTo(
        fromPromiseRetry()(() => this.dataPreviewerStencilCmp.nativeElement.getDownloadPreviewHref()).pipe(
          concatMap((downloadHref: string) => {
            return fromPromiseRetry({ retries: 0 })(() => this.dataPreviewerStencilCmp.nativeElement.getDownloadCsvHref()).pipe(
              catchError(err => of(null)),
              map(csvHref => {
                return {
                  downloadHref,
                  csvHref
                }
              })
            )
          })
        )
      ),
      take(1)
    ).subscribe(({ downloadHref, csvHref }) => {
      if (csvHref) this.downloadCsvHref = this.sanitizer.bypassSecurityTrustResourceUrl(csvHref)
      this.downloadHref = this.sanitizer.bypassSecurityTrustResourceUrl(downloadHref)
    })

    this.subscriptions.push(
      hydrateHrefSubscription
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}