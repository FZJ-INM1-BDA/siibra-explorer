import { DOCUMENT } from "@angular/common";
import { Directive, HostListener, Inject, Input } from "@angular/core";
import { TZipFileConfig } from "./type";

@Directive({
  selector: '[single-file-output]',
  exportAs: 'singleFileOutput'
})

export class SingleFileOutput {

  @Input('single-file-output')
  singleFile: TZipFileConfig

  @HostListener('click')
  onClick(): void{
    const anchor = this.doc.createElement('a')
    const blob = new Blob([this.singleFile.filecontent], { type: 'text/plain' })
    anchor.href = URL.createObjectURL(blob)
    anchor.download = this.singleFile.filename

    this.doc.body.appendChild(anchor)
    anchor.click()
    this.doc.body.removeChild(anchor)
    URL.revokeObjectURL(anchor.href)
  }
  constructor(
    @Inject(DOCUMENT) private doc: Document
  ){

  }
}
