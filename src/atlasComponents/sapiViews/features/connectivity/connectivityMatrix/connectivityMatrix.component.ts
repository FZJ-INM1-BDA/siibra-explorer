import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges } from "@angular/core";
import { SAPI, SapiAtlasModel, SapiParcellationModel } from "src/atlasComponents/sapi";
import { PARSE_TYPEDARRAY } from "src/atlasComponents/sapi/sapi.service";
import { SapiParcellationFeatureMatrixModel, SapiSerializationErrorModel } from "src/atlasComponents/sapi/type";
import { EnumColorMapName } from "src/util/colorMaps";

@Component({
  selector: 'sxplr-sapiviews-features-connectivity-matrix',
  templateUrl: './connectivityMatrix.template.html',
  styleUrls: [
    `./connectivityMatrix.style.css`
  ]
})

export class ConnectivityMatrixView implements OnChanges, AfterViewInit{

  @Input('sxplr-sapiviews-features-connectivity-matrix-atlas')
  atlas: SapiAtlasModel
  
  @Input('sxplr-sapiviews-features-connectivity-matrix-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-features-connectivity-matrix-featureid')
  featureId: string

  matrixData: SapiParcellationFeatureMatrixModel
  private pleaseRender = false
  private renderBuffer: Uint8ClampedArray
  width: number
  height: number
  
  private async fetchMatrixData(){
    this.matrixData = null
    const matrix = await this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatureInstance(this.featureId)
    if ((matrix as SapiSerializationErrorModel)?.type === "spy/serialization-error") {
      return
    }
    this.matrixData = matrix as SapiParcellationFeatureMatrixModel
    this.width = this.matrixData.matrix["x-width"]
    this.height = this.matrixData.matrix["x-height"]
  }

  ngAfterViewInit(): void {
    if (this.pleaseRender) {
      this.renderCanvas()
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    await this.fetchMatrixData()
    const { result, max, min } = await this.sapi.processNpArrayData<PARSE_TYPEDARRAY.CANVAS_COLORMAP_RGBA>(this.matrixData.matrix, PARSE_TYPEDARRAY.CANVAS_COLORMAP_RGBA, { colormap: EnumColorMapName.JET })
    const rawResult = await this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(this.matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY)
    console.log({
      rawResult
    })
    this.renderBuffer = result
    this.renderCanvas()
  }

  private renderCanvas(){

    if (!this.el) {
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

  constructor(private sapi: SAPI, private el: ElementRef){

  }

}