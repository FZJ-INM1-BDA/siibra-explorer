import { Directive, Input, SimpleChanges } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { TabularFeature } from "src/atlasComponents/sapi/sxplrTypes"

@Directive()
export abstract class BaseReceptor{
  
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

  @Input('sxplr-sapiviews-features-receptor-data')
  receptorData: TabularFeature<number>

  error: string

  async ngOnChanges(simpleChanges: SimpleChanges) {
    if (simpleChanges.receptorData?.currentValue) {
      this.rerender()
      return
    }
    if (this.canFetch) {
      this.receptorData = await this.fetchReceptorData()
      this.rerender()
    }
  }

  private get canFetch() {
    if (!this.atlas) {
      this.error = `atlas needs to be defined, but is not`
      return false
    }
    if (!this.parcellation) {
      this.error = `parcellation needs to be defined, but is not`
      return false
    }
    if (!this.region) {
      this.error = `region needs to be defined, but is not`
      return false
    }
    if (!this.featureId) {
      this.error = `featureId needs to be defined, but is not`
      return false
    }
    return true
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
    const result = await this.sapi.getRegion(this.atlas["@id"], this.parcellation["@id"], this.region.name).getFeatureInstance(this.featureId, this.template["@id"]).toPromise()
    if (result["@type"] !== "siibra/features/receptor") {
      throw new Error(`BaseReceptor Error. Expected .type to be "siibra/features/receptor", but was "${result['@type']}"`)
    }
    return result
  }

  abstract rerender(): void

  /**
   * flag to indicate that getDataBlob() can be called.
   */
  dataBlobAvailable = false
  /**
   * blob object observable, representing the data of the component. This allows the data to be downloaded.
   */
  dataBlob$ = new BehaviorSubject<Blob>(null)

  constructor(
    protected sapi: SAPI
  ){
  }
}
