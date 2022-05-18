import {Directive, Input, OnDestroy} from "@angular/core";
import {from, of, Subscription} from "rxjs";
import {map, switchMap, take} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {PARSE_TYPEDARRAY, SAPI} from "src/atlasComponents/sapi/sapi.service";
import {
  SapiAtlasModel, SapiModalityModel,
  SapiParcellationFeatureMatrixModel, SapiParcellationFeatureModel,
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

    private regionIndex: number
    public hasConnectivity = false
    public connectivityNumber = 0

    private connectivityModalities: SapiModalityModel[] = []
    private waitForModalities = false
    public defaultProfile: DefaultProfile
    public availableModalities: SapiModalityModel[] = []

    constructor(private httpClient: HttpClient,
                private sapi: SAPI) {
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
            .getFeatures({type, page: 1, size: 1})
            .pipe(
              take(1),
              // ToDo remove any type when `SapiParcellationFeatureModel` will be fixed
              switchMap((res: SapiParcellationFeatureModel[] | any) => {
                if (res && res.items) {

                  this.availableModalities.push(m)
                  const firstDataset = res.items[0]

                  if (firstDataset) {
                    this.hasConnectivity = true
                    if (!(this.defaultProfile)) {
                      return this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"])
                        .getFeatureInstance(firstDataset['@id'])
                        .pipe(switchMap(inst => {
                          if (inst) {
                            this.defaultProfile = {
                              type,
                              selectedDataset: firstDataset,
                              matrix: inst,
                              numberOfDatasets: res.total
                            }

                            const matrixData = inst as SapiParcellationFeatureMatrixModel
                            this.regionIndex = (matrixData.columns as Array<string>).findIndex(md => md === this.region.name)
                            return from(this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY))
                          }
                          return of(null)
                        }))
                    }
                  } else {
                    this.hasConnectivity = false
                    this.connectivityNumber = 0
                  }
                }
                return of(null)
              }), 
            ).subscribe(res => {
              if (res && res.rawArray && res.rawArray[this.regionIndex]) {
                const connections = res.rawArray[this.regionIndex]
                this.connectivityNumber = connections.filter(p => p > 0).length
              }
            })
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