import {Directive, Input, OnDestroy} from "@angular/core";
import {from, of, Subscription} from "rxjs";
import {map, switchMap, take} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {PARSE_TYPEDARRAY, SAPI} from "src/atlasComponents/sapi/sapi.service";
import {SapiAtlasModel, SapiParcellationFeatureMatrixModel, SapiParcellationModel} from "src/atlasComponents/sapi/type";

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

    private _region: any

    @Input()
    set region(val) {
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
    
    private connectivityModalities: any[] = []
    private waitForModalities = false
    public defaultProfile: any
    public availableModalities: string[] = []

    constructor(private httpClient: HttpClient,
                private sapi: SAPI) {
      this.sapi.getModalities()
        .pipe(map((mod: any[]) => mod.filter((m: any) => m.types && m.types.find(t => t.includes('siibra/features/connectivity')))))
        .subscribe(modalities => {
          this.connectivityModalities = modalities
          if (this.waitForModalities) {
            this.waitForModalities = false
            this.checkConnectivity()
          }  
        })
    }

    private checkConnectivity() {
      this.defaultProfile = {}
      if (this.region.name) {
        this.connectivityModalities.forEach(m => {
          const type = m.types[0]
          
          this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"])
            .getFeatures({page: 0, perPage: 20}, type)
            .pipe(
              take(1),  
              switchMap((datasets: any[]) => {
                if (datasets && datasets.length) {

                  this.availableModalities.push(m)

                  if (datasets[0]) {

                    this.hasConnectivity = true
                    if (!(this.defaultProfile && this.defaultProfile.length)) {
                      return this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"])
                        .getFeatureInstance(datasets[0]['@id'])
                        .pipe(switchMap(inst => {
                          if (inst) {
                            // if () {
                            this.defaultProfile = {
                              type,
                              datasets,
                              selectedDataset: datasets[0]['@id'],
                              matrix: inst
                            }


                            const matrixData = inst as SapiParcellationFeatureMatrixModel
                            this.regionIndex = (matrixData.columns as Array<string>).findIndex(md => md === this.region.name)
                            return from(this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY))
                            // }
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
              // switchMap(res => {
              //   if (res) {
              //     if (!(this.defaultProfile && this.defaultProfile.length)) {
              //       this.defaultProfile = {type, matrix: res}
              //     }
              //
              //     const matrixData = res as SapiParcellationFeatureMatrixModel
              //     this.regionIndex = (matrixData.columns as Array<string>).findIndex(md => md === this.region.name)
              //     // this.connectedAreas = matrixData.columns as Array<string>
              //     return from(this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY))
              //   }
              //   return of(null)
              // })
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
