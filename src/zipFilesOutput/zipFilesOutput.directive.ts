import { Directive, HostListener, Inject, Input } from "@angular/core";
import { TZipFileConfig } from "./type";
import * as JSZip from "jszip";
import { DOCUMENT } from "@angular/common";

@Directive({
  selector: '[zip-files-output]',
  exportAs: 'zipFilesOutput'
})

export class ZipFilesOutput {
  @Input('zip-files-output')
  zipFiles: TZipFileConfig[] = []

  @Input('zip-files-output-zip-filename')
  zipFilename = 'archive.zip'

  @HostListener('click')
  async onClick(){
    const zip = new JSZip()
    for (const zipFile of this.zipFiles) {
      const { filecontent, filename, base64 } = zipFile
      zip.file(filename, filecontent, { base64 })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const anchor = this.doc.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = this.zipFilename

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

export async function unzip(file: File): Promise<TZipFileConfig[]>{
  const zip = new JSZip()
  const loadedAsync = await zip.loadAsync(file)
  
  const out: TZipFileConfig[] = []
  for (const filename in loadedAsync.files) {
    const filecontent = await loadedAsync.files[filename].async('string')
    out.push({
      filename,
      filecontent
    })
  }
  return out
}
