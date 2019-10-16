import { ViewChild, ElementRef } from "@angular/core";
import { SafeUrl, DomSanitizer } from "@angular/platform-browser";
import { Subject, Subscription, Observable, from, interval } from "rxjs";
import { mapTo, map, shareReplay, switchMapTo, take, switchMap, filter } from "rxjs/operators";

export class ChartBase{
  @ViewChild('canvas') canvas: ElementRef

  private _csvData: string

  public csvDataUrl: SafeUrl
  public csvTitle: string
  public imageTitle: string

  private _subscriptions: Subscription[] = []
  private _newChart$: Subject<any> = new Subject()

  private _csvUrl: string
  private _pngUrl: string

  public csvUrl$: Observable<SafeUrl>
  public pngUrl$: Observable<SafeUrl>

  constructor(private sanitizer: DomSanitizer){
    this.csvUrl$ = this._newChart$.pipe(
      mapTo(this._csvData),
      map(data => {
        const blob = new Blob([data], { type: 'data:text/csv;charset=utf-8' })
        if (this._csvUrl) window.URL.revokeObjectURL(this._csvUrl)
        this._csvUrl = window.URL.createObjectURL(blob)
        return this.sanitizer.bypassSecurityTrustUrl(this._csvUrl)
      }),
      shareReplay(1)
    )

    this.pngUrl$ = this._newChart$.pipe(
      switchMapTo(
        interval(500).pipe(
          map(() => this.canvas && this.canvas.nativeElement),
          filter(v => !!v),
          switchMap(el => 
            from(
              new Promise(rs => el.toBlob(blob => rs(blob), 'image/png'))
            ) as Observable<Blob>
          ),
          filter(v => !!v),
          take(1)
        )
      ),
      map(blob => {
        if (this._pngUrl) window.URL.revokeObjectURL(this._pngUrl)
        this._pngUrl = window.URL.createObjectURL(blob)
        return this.sanitizer.bypassSecurityTrustUrl(this._pngUrl)
      }),
      shareReplay(1)
    )

    // necessary 
    this._subscriptions.push(
      this.pngUrl$.subscribe()
    )

    this._subscriptions.push(
      this.csvUrl$.subscribe()
    )
  }

  superOnDestroy(){
    if (this._csvUrl) window.URL.revokeObjectURL(this._csvUrl)
    if (this._pngUrl) window.URL.revokeObjectURL(this._pngUrl)
    while(this._subscriptions.length > 0) this._subscriptions.pop().unsubscribe()
  }

  generateNewCsv(csvData: string){
    this._csvData = csvData
    this.csvDataUrl = this.sanitizer.bypassSecurityTrustUrl(`data:text/csv;charset=utf-8,${csvData}`)
    this._newChart$.next(null)
  }

}