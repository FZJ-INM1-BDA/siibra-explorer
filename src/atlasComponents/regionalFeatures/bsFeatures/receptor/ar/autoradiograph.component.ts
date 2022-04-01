import { Component, ElementRef, Input, OnChanges, ViewChild } from "@angular/core";
import { BsFeatureReceptorBase } from "../base";
import { CONST } from 'common/constants'
import { environment } from 'src/environments/environment'
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";

const { RECEPTOR_AR_CAPTION } = CONST

export function isAr(filename: string, label: string = ''){
  return filename.indexOf(`_ar_${label}`) >= 0
}

@Component({
  selector: 'bs-features-receptor-autoradiograph',
  templateUrl: './autoradiograph.template.html',
  styleUrls: [
    './autoradiograph.style.css'
  ]
})

export class BsFeatureReceptorAR extends BsFeatureReceptorBase implements OnChanges {

  public RECEPTOR_AR_CAPTION = RECEPTOR_AR_CAPTION
  private DS_PREVIEW_URL = environment.DATASET_PREVIEW_URL

  @Input()
  bsLabel: string

  @ViewChild('arContainer', { read: ElementRef })
  arContainer: ElementRef

  private renderBuffer: Uint8ClampedArray
  private width: number
  private height: number
  private pleaseRender = false

  constructor(private worker: AtlasWorkerService){
    super()
  }
  async ngOnChanges(){
    this.error = null
    this.urls = []
    if (!this.bsFeature) {
      this.error = `bsFeature not populated`
      return
    }
    if (!this.bsLabel) {
      this.error = `bsLabel not populated`
      return
    }

    this.urls = this.bsFeature.__files
      .filter(url => isAr(url, this.bsLabel))
      .map(url => {
        return { url }
      })
    try {
      const {
        "x-channel": channel,
        "x-height": height,
        "x-width": width,
        content_type: contentType,
        content_encoding: contentEncoding,
        content,
      } = this.bsFeature.__data.__autoradiographs[this.bsLabel]

      if (contentType !== "application/octet-stream") {
        throw new Error(`contentType expected to be application/octet-stream, but is instead ${contentType}`)
      }
      if (contentEncoding !== "gzip; base64") {
        throw new Error(`contentEncoding expected to be gzip; base64, but is ${contentEncoding} instead.`)
      }

      const bin = atob(content)
      const { pako } = (window as any).export_nehuba
      const uint8array: Uint8Array = pako.inflate(bin)

      this.width = width
      this.height = height

      const rgbaBuffer = await this.worker.sendMessage({
        method: "PROCESS_TYPED_ARRAY",
        param: {
          inputArray: uint8array,
          width,
          height,
          channel
        },
        transfers: [ uint8array.buffer ]
      })

      this.renderBuffer = rgbaBuffer.result.buffer
      this.renderCanvas()
    } catch (e) {
      this.error = e.toString()
    }
  }

  private renderCanvas(){
    if (!this.arContainer) {
      this.pleaseRender = true
      return
    }

    const arContainer = (this.arContainer.nativeElement as HTMLElement)
    while (arContainer.firstChild) {
      arContainer.removeChild(arContainer.firstChild)
    }

    const canvas = document.createElement("canvas")
    canvas.height = this.height
    canvas.width = this.width
    arContainer.appendChild(canvas)
    const ctx = canvas.getContext("2d")
    const imgData = ctx.createImageData(this.width, this.height)
    imgData.data.set(this.renderBuffer)
    ctx.putImageData(imgData, 0, 0)
  }

  ngAfterViewChecked(){
    if (this.pleaseRender) this.renderCanvas()
  }
}