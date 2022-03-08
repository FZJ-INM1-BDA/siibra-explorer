import { Directive, Input } from "@angular/core";
import { SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { strToRgb, rgbToHsl, hexToRgb } from 'common/util'

@Directive({
  selector: `sxplr-sapiviews-core-region`
})
export class SapiViewsCoreRegionRegionBase {

  @Input('sxplr-sapiviews-core-region-atlas')
  atlas: SapiAtlasModel
  @Input('sxplr-sapiviews-core-region-template')
  template: SapiSpaceModel
  @Input('sxplr-sapiviews-core-region-parcellation')
  parcellation: SapiParcellationModel

  private _region: SapiRegionModel 
  @Input('sxplr-sapiviews-core-region-region')
  set region(val: SapiRegionModel) {
    this._region = val
    this.setupRegionDarkmode()
  }
  get region(){
    return this._region
  }

  regionRgbString: string = `rgb(200, 200, 200)`
  regionDarkmode = false
  // in mm!!
  regionPosition: number[] = null
  dois: string[] = []

  protected setupRegionDarkmode(){

    this.regionRgbString = `rgb(200, 200, 200)`
    this.regionDarkmode = false
    this.regionPosition = null
    this.dois = []

    if (this.region) {

      /**
       * color
       */
      let rgb = [255, 200, 200]
      if (this.region.hasAnnotation?.displayColor) {
        rgb = hexToRgb(this.region?.hasAnnotation?.displayColor)
      } else {
        rgb = strToRgb(JSON.stringify(this.region))
      }
      this.regionRgbString = `rgb(${rgb.join(',')})`
      const [_h, _s, l] = rgbToHsl(...rgb)
      this.regionDarkmode = l < 0.4
      
      /**
       * position
       */
      this.regionPosition = this.region.hasAnnotation?.bestViewPoint?.coordinates.map(v => v.value)

      /**
       * dois
       */
      this.dois = (this.region.hasAnnotation?.inspiredBy || [])
        .map(insp => insp["@id"] as string)
        .filter(id => /^https?:\/\/doi\.org/.test(id))
    }
  }

  navigateTo(position: number[]) {
    console.log('navigate to region', position)
  }
}
