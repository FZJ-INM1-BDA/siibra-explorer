import { Directive, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { rgbToHsl } from 'common/util'
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { Subject } from "rxjs";
import { SAPIRegion } from "src/atlasComponents/sapi/core";

@Directive({
  selector: `[sxplr-sapiviews-core-region]`,
  exportAs: "sapiViewsCoreRegion"
})
export class SapiViewsCoreRegionRegionBase {

  @Input('sxplr-sapiviews-core-region-detail-flag')
  shouldFetchDetail = false
  public fetchInProgress = false

  @Input('sxplr-sapiviews-core-region-atlas')
  atlas: SapiAtlasModel
  @Input('sxplr-sapiviews-core-region-template')
  template: SapiSpaceModel
  @Input('sxplr-sapiviews-core-region-parcellation')
  parcellation: SapiParcellationModel

  @Output('sxplr-sapiviews-core-region-navigate-to')
  onNavigateTo = new EventEmitter<number[]>()

  protected region$ = new Subject<SapiRegionModel>()
  private _region: SapiRegionModel
  @Input('sxplr-sapiviews-core-region-region')
  set region(val: SapiRegionModel) {
    
    this.region$.next(val)

    if (!this.shouldFetchDetail || !val) {
      this._region = val
      this.setupRegionDarkmode()
      return
    }
    this.fetchInProgress = true
    this._region = null
    
    this.fetchDetail(val)
      .then(r => {
        this._region = r
      })
      .catch(e => {
        console.warn(`populating detail failed.`, e)
        this._region = val
      })
      .finally(() => {
        this.fetchInProgress = false
        this.setupRegionDarkmode()
      })
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
      let rgb = SAPIRegion.GetDisplayColor(this.region)
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
    this.onNavigateTo.emit(position.map(v => v*1e6))
  }

  protected async fetchDetail(region: SapiRegionModel) {
    return await this.sapi.getRegion(this.atlas["@id"],this.parcellation["@id"], region.name).getDetail(this.template["@id"])
  }

  constructor(protected sapi: SAPI){

  }
}
