import { Input, SimpleChanges } from "@angular/core";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { SapiRegionalFeatureReceptorModel } from "src/atlasComponents/sapi/type";

export class BaseReceptor{
  
  @Input('sxplr-sapiviews-features-receptor-atlas')
  atlas: SapiAtlasModel
  
  @Input('sxplr-sapiviews-features-receptor-parcellation')
  parcellation: SapiParcellationModel

  @Input('sxplr-sapiviews-features-receptor-template')
  template: SapiSpaceModel
  
  @Input('sxplr-sapiviews-features-receptor-region')
  region: SapiRegionModel

  @Input('sxplr-sapiviews-features-receptor-featureid')
  featureId: string

  receptorData: SapiRegionalFeatureReceptorModel

  error: string

  protected baseInputChanged(simpleChanges: SimpleChanges) {
    const {
      atlas,
      parcellation,
      template,
      region,
      featureId,
    } = simpleChanges
    return atlas
      || parcellation
      || template
      || region
      || featureId
  }

  protected async fetchReceptorData() {
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
    const result = await this.sapi.getRegion(this.atlas["@id"], this.parcellation["@id"], this.region.name).getFeatureInstance(this.featureId, this.template["@id"])
    if (result.type !== "siibra/receptor") {
      throw new Error(`BaseReceptor Error. Expected .type to be "siibra/receptor", but was "${result.type}"`)
    }
    this.receptorData = result
  }

  constructor(
    protected sapi: SAPI
  ){
  }
}
