import { Input } from "@angular/core";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { SapiRegionalFeatureReceptorModel } from "src/atlasComponents/sapi/type";

export class BaseReceptor{
  
  @Input('sxplor-sapiviews-features-receptor-atlas')
  atlas: SapiAtlasModel
  
  @Input('sxplor-sapiviews-features-receptor-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplor-sapiviews-features-receptor-template')
  template: SapiSpaceModel
  
  @Input('sxplor-sapiviews-features-receptor-region')
  region: SapiRegionModel

  @Input('sxplor-sapiviews-features-receptor-featureid')
  featureId: string

  receptorData: SapiRegionalFeatureReceptorModel

  error: string

  async ngOnChanges(){
    console.log("ngOnchanges called", this)
    this.error = null
    if (!this.atlas) {
      this.error = `atlas needs to be defined, but is not`
      return
    }
    if (!this.parcellation) {
      this.error = `parcellation needs to be defined, but is not`
      return
    }
    if (!this.region) {
      this.error = `region needs to be defined, but is not`
      return
    }
    if (!this.featureId) {
      this.error = `featureId needs to be defined, but is not`
      return
    }
    console.log("fetching!")
    const result = await this.sapi.getRegion(this.atlas["@id"], this.parcellation["@id"], this.region.name).getFeatureInstance(this.featureId, this.template["@id"])
    if (result.type !== "siibra/receptor") {
      throw new Error(`BaseReceptor Error. Expected .type to be "siibra/receptor", but was "${result.type}"`)
    }
    this.receptorData = result
    console.log(this.receptorData)
  }

  constructor(
    protected sapi: SAPI
  ){
    console.log('constructor called')
  }
}
