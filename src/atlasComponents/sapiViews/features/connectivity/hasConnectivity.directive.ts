import {Directive, Input, OnDestroy} from "@angular/core";
import {Subscription} from "rxjs";
import {map, take} from "rxjs/operators";
import {SAPI} from "src/atlasComponents/sapi/sapi.service";
import {
  SapiAtlasModel, SapiModalityModel,
  SapiParcellationFeatureModel,
  SapiParcellationModel,
  SapiRegionModel
} from "src/atlasComponents/sapi/type";

@Directive({
  selector: '[sxplr-sapiviews-features-connectivity-check]',
  exportAs: 'hasConnectivityDirective'
})

export class HasConnectivity implements OnDestroy {

    private subscriptions: Subscription[] = []

    @Input('sxplr-sapiviews-features-connectivity-check-atlas')
    atlas: SapiAtlasModel

    @Input('sxplr-sapiviews-features-connectivity-check-parcellation')
    parcellation: SapiParcellationModel

    private _region: SapiRegionModel

    @Input()
    set region(val: SapiRegionModel) {
      this._region = val
      if (val) {
        if (!this.connectivityModalities.length) {
          this.waitForModalities = true
        } else {
          this.checkConnectivity()
        }
      } else {
        this.connectivityNumber = 0
      }
    }

    get region() {
      return this._region
    }

    public hasConnectivity = false
    public connectivityNumber = 0

    private connectivityModalities: SapiModalityModel[] = []
    private waitForModalities = false
    public defaultProfile: DefaultProfile
    public availableModalities: SapiModalityModel[] = []
    public numberOfDatasets: number = 0

    constructor(private sapi: SAPI) {
      this.getModalities()            
    }

    getModalities() {        
      this.sapi.getModalities()
        .pipe(map((mod: SapiModalityModel[]) => mod.filter((m: SapiModalityModel) => m.types && m.types.find(t => t.includes('siibra/features/connectivity')))))
        .subscribe(modalities => {
          this.connectivityModalities = modalities
          if (this.waitForModalities) {
            this.waitForModalities = false
            this.checkConnectivity()
          } 

        })
    }

    private checkConnectivity() {
      if (this.region.name) {
        this.connectivityModalities.forEach(m => {
          const type = m.types[0]
          
          this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"])
            .getFeatures({type, page: 1, size: 1}).pipe(take(1), map((res: SapiParcellationFeatureModel[] | any) => {
              if (res && res.items) {
                  this.availableModalities.push(m)
                  const firstDataset = res.items[0]

                  if (firstDataset) {
                    this.hasConnectivity = true
                  } else {
                    this.hasConnectivity = false
                    this.connectivityNumber = 0
                  }
                }
              }), 
            ).subscribe()
        })
      }
    }

    ngOnDestroy(){
      while (this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
    }
}

type DefaultProfile = {
    type: string
    selectedDataset: SapiParcellationFeatureModel
    matrix: SapiParcellationFeatureModel
    numberOfDatasets: number
}