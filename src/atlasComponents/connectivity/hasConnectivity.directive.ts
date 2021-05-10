import {Directive, Inject, Input, OnDestroy, OnInit} from "@angular/core";
import {of, Subscription} from "rxjs";
import {switchMap} from "rxjs/operators";
import {BS_ENDPOINT} from "src/util/constants";
import {HttpClient} from "@angular/common/http";

@Directive({
  selector: '[has-connectivity]',
  exportAs: 'hasConnectivityDirective'
})

export class HasConnectivity implements OnInit, OnDestroy {

    private subscriptions: Subscription[] = []

    @Input() region: any

    public hasConnectivity = false
    public connectivityNumber = 0

    constructor(@Inject(BS_ENDPOINT) private siibraApiUrl: string,
                private httpClient: HttpClient) {}

    ngOnInit() {
      this.checkConnectivity(this.region[0])
    }

    checkConnectivity(region) {
      const {atlas, parcellation, template} = region.context
      if (region.id && region.id.kg) {
        const regionId = `${region.id.kg.kgSchema}/${region.id.kg.kgId}`

        const connectivityUrl = `${this.siibraApiUrl}/atlases/${encodeURIComponent(atlas['@id'])}/parcellations/${encodeURIComponent(parcellation['@id'])}/regions/${encodeURIComponent(regionId)}/features/ConnectivityProfile`

        this.subscriptions.push(
          this.httpClient.get<[]>(connectivityUrl).pipe(switchMap((res: any[]) => {
            if (res && res.length) {
              this.hasConnectivity = true
              const url = `${connectivityUrl}/${encodeURIComponent(res[0]['@id'])}`
              return this.httpClient.get(url)
            } else {
              this.hasConnectivity = false
              this.connectivityNumber = 0
            }
            return of(null)
          })).subscribe(res => {

            if (res && res['__profile']) {
              this.connectivityNumber = res['__profile'].filter(p => p > 0).length
            }
          })
        )
      }
    }

    ngOnDestroy(){
      while (this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
    }

}
