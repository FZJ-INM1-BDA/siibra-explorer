import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges } from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import { PARSE_TYPEDARRAY } from "src/atlasComponents/sapi/sapi.service";
import { BaseReceptor } from "../base";

@Component({
  selector: `sxplr-sapiviews-features-receptor-autoradiograph`,
  templateUrl: './autoradiography.template.html',
  styleUrls: [
    './autoradiography.style.css'
  ],
  exportAs: 'sxplrSapiViewsFeaturesReceptorAR'
})

export class Autoradiography extends BaseReceptor implements OnChanges, AfterViewInit{
  
  @Input('sxplr-sapiviews-features-receptor-autoradiograph-selected-symbol')
  selectedSymbol: string

  private pleaseRender = false

  width: number
  height: number
  renderBuffer: Uint8ClampedArray

  async ngOnChanges(simpleChanges: SimpleChanges) {
    await super.ngOnChanges(simpleChanges)
    if (!this.receptorData) {
      return
    }
    if (this.selectedSymbol) {
      const fp = this.receptorData.data.autoradiographs[this.selectedSymbol]
      if (!fp) {
        this.error = `selectedSymbol ${this.selectedSymbol} cannot be found. Valid symbols are ${Object.keys(this.receptorData.data.autoradiographs)}`
        return
      }
      const { "x-width": width, "x-height": height } = fp
      
      this.width = width
      this.height = height

      const { result } = await this.sapi.processNpArrayData<PARSE_TYPEDARRAY.CANVAS_FORTRAN_RGBA>(fp, PARSE_TYPEDARRAY.CANVAS_FORTRAN_RGBA)
      this.renderBuffer = result
      this.rerender()
    }
  }
  constructor(sapi: SAPI, private el: ElementRef){
    super(sapi)
  }

  ngAfterViewInit(): void {
    if (this.pleaseRender) this.rerender()
  }

  rerender(){
    if (!this.el || !this.renderBuffer) {
      this.pleaseRender = true
      return
    }

    const arContainer = (this.el.nativeElement as HTMLElement)
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
    this.pleaseRender = false
  }
}
