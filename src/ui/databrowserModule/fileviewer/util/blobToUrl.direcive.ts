import { Directive, Input, OnChanges, OnDestroy } from "@angular/core";
import { SafeUrl, DomSanitizer } from "@angular/platform-browser";

/**
 * URL.createObjectURL does not get GC'ed.
 * so their initialisation and destroy need to be handled by angular life cycle
 * thus, directive is needed, rather than a pipe
 */

@Directive({
  selector: '[iav-blob-to-url]',
  exportAs: 'iavBlobToUrl'
})

export class BlobToUrlDirective implements OnChanges, OnDestroy{

  public url:SafeUrl

  private _url: string

  constructor(private sanitizer: DomSanitizer){

  }

  @Input('iav-blob-to-url')
  blob: Blob

  ngOnChanges(){
    this.ngOnDestroy()
    if (this.blob) {
      this._url = window.URL.createObjectURL(this.blob)
      this.url = this.sanitizer.bypassSecurityTrustUrl(this._url)
    }
  }

  ngOnDestroy(){
    this.url = null
    if (this._url) window.URL.revokeObjectURL(this._url)
  }
}