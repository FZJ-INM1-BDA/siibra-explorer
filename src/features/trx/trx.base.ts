import { Directive, inject, Input } from "@angular/core"
import { BehaviorSubject, from, of } from "rxjs"
import { switchMap, take } from "rxjs/operators"
import { SAPI } from "src/atlasComponents/sapi"
import { GEOMSVC_HOST, PaginatedResponse } from "./const"
import { NehubaLayerControlService } from "src/viewerModule/nehuba/layerCtrl.service"
import { DestroyDirective } from "src/util/directives/destroy.directive"
import { strToRgb } from "common/util"

const FIBER_DETAIL_LAYER_ID = 'geomsvc-fiber-detail'

@Directive({
  selector: '[geomsvc-trx]',
  standalone: true,
  hostDirectives: [
    DestroyDirective
  ]
})
export class TRXBase {

  protected destroy$ = inject(DestroyDirective).destroyed$

  protected uuid$ = new BehaviorSubject<string | undefined>(undefined)
  @Input()
  set uuid(val: string) {
    this.uuid$.next(val)
  }

  constructor(){
    NehubaLayerControlService.RegisterLayerName(FIBER_DETAIL_LAYER_ID)
    this.destroy$.subscribe(() => {
      NehubaLayerControlService.DeregisterLayerName(FIBER_DETAIL_LAYER_ID)
      this.unloadGroup()
    })
  }

  protected groupNames$ = this.uuid$.pipe(
    switchMap(uuid => {
      if (!uuid) {
        return of([])
      }

      const url = `${GEOMSVC_HOST}/fiber_n/${uuid}/detail`

      const getpage = (page: number) => from(
        fetch(`${url}?page=${page}`)
          .then(res => res.json() as Promise<PaginatedResponse<{ fibername: string, index: number }>>)
      )

      return from(getpage(1)).pipe(
        switchMap(resp => SAPI.IteratePages(resp, getpage))
      )
    })
  )

  #detailLayer: any

  protected unloadGroup(){
    if (this.#detailLayer) {
      (window as any).viewer.layerManager.removeManagedLayer(this.#detailLayer)
      this.#detailLayer = null
    }
  }

  protected async loadGroup(fibername: string){
    this.unloadGroup()

    const rgb = strToRgb(fibername)

    const uuid = await this.uuid$.pipe(
      take(1)
    ).toPromise()
    
    const opt = {
      "type": "segmentation",
      "opacity": 1,
      "clType": "customlayer/nglayer",
      "segments": [0],
      "source": `precomputed://${GEOMSVC_HOST}/fiber_n/${uuid}/detail/${fibername}/ngskeleton`
    }
    this.#detailLayer = (window as any).nehubaViewer.addLayer(opt, FIBER_DETAIL_LAYER_ID);
    
    (window as any).nehubaViewer.setSegmentsColors({
        0: rgb.map(v => v/255)
    }, FIBER_DETAIL_LAYER_ID);

    setTimeout(() => {
      (window as any).nehubaViewer.setMeshesToLoad([0], {
        name: FIBER_DETAIL_LAYER_ID
      });
    }, 1000)
  }
}
