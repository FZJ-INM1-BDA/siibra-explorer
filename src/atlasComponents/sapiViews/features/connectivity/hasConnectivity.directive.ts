import {Directive, Input, OnDestroy} from "@angular/core";
import {from, of, Subscription} from "rxjs";
import {switchMap} from "rxjs/operators";
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
        this.checkConnectivity()
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

    constructor(private httpClient: HttpClient,
                private sapi: SAPI) {}

    checkConnectivity() {
      if (this.region.name) {
        this.subscriptions.push(
          from(this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatures())
            .pipe(
              switchMap((res: any[]) => {
                const firstCon = res.find(r => r.type === 'siibra/features/connectivity')
                if (firstCon) {
                  this.hasConnectivity = true
                  return this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatureInstance(firstCon['@id'])
                } else {
                  this.hasConnectivity = false
                  this.connectivityNumber = 0
                }
                return of(null)
              }), 
              switchMap(res => {
                if (res) {
                  const matrixData = res as SapiParcellationFeatureMatrixModel
                  this.regionIndex = (matrixData.columns as Array<string>).findIndex(md => md === this.region.name)
                  return from(this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY))
                } 
                return of(null)
              })
            ).subscribe(res => {
              if (res && res.rawArray && res.rawArray[this.regionIndex]) {
                this.connectivityNumber = res.rawArray[this.regionIndex].filter(p => p > 0).length
              }
            })
        )
      }
    }

    ngOnDestroy(){
      while (this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
    }

}
