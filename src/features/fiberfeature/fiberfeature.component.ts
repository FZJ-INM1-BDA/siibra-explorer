import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, from, of, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, map, shareReplay, switchMap, take, takeUntil, withLatestFrom } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { AngularMaterialModule } from "src/sharedModules";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor } from "src/util/injectionTokens";

const PROD_GEOMSVC_HOST = "https://geom-svc.apps.ebrains.eu"
// const LOCAL_GEOMSVC_HOST = "http://localhost:8000"
const GEOMSVC_HOST = PROD_GEOMSVC_HOST
type PaginatedResponse<T> = {
  items: T[]
  total?: number
  page?: number
  size?: number
  pages?: number
}

const FIBER_OVERVIEW_LAYER_ID = 'geomsvc-fiber-overview'
const FIBER_DETAIL_LAYER_ID = 'geomsvc-fiber-detail'

@Component({
  selector: 'fiber-feature',
  standalone: true,
  templateUrl: './fiberfeature.template.html',
  styleUrls: [
    './fiberfeature.style.scss'
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
  ],
  hostDirectives: [
    DestroyDirective,
  ]
})

export class FiberFeatureCmp {

  #destroy$ = inject(DestroyDirective).destroyed$
  #store = inject(Store)
  #hoverInterceptor = inject(HOVER_INTERCEPTOR_INJECTOR, { optional: true }) as HoverInterceptor
  #clickInterceptor = inject(CLICK_INTERCEPTOR_INJECTOR, { optional: true }) as ClickInterceptor

  selectedFiber = new FormControl<string|null>(null)

  #uuid$ = new BehaviorSubject<string | undefined>(undefined)
  @Input()
  set uuid(val: string) {
    this.#uuid$.next(val)
  }
  #bundleNames$ = this.#uuid$.pipe(
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

  view$ = combineLatest([
    this.#uuid$,
    this.#bundleNames$
  ]).pipe(
    map(([uuid, bundlenames]) => {
      return {
        uuid,
        bundlenames,
      }
    }),
    shareReplay(1)
  )

  #overviewLayer: any
  #detailLayer: any

  #destroycbs: (() => void)[] = []
  #hoverValue$ = new Subject<number | null>()
  #hoverFiber$ = this.#hoverValue$.pipe(
    withLatestFrom(this.view$),
    map(([hoveredValue, { bundlenames }]) => {
      if (hoveredValue === null) {
        return undefined
      }
      return bundlenames.find(({ index }) => index === hoveredValue)})
  )

  constructor() {
    if (this.#hoverInterceptor) {
      const { append, remove } = this.#hoverInterceptor

      const mouseState = (window as any).viewer.mouseState
      const res: () => void = mouseState.changed.add(() => {
        if (!mouseState.active) {
          this.#hoverValue$.next(null)
          return
        }
        if (!this.#overviewLayer) {
          this.#hoverValue$.next(null)
          return
        }
        const bingo = this.#overviewLayer.layer.renderLayers.includes(mouseState.pickedRenderLayer)
        if (!bingo) {
          this.#hoverValue$.next(null)
          return
        }
        this.#hoverValue$.next(Number(mouseState.pickedValue))
      })
      this.#destroycbs.push(res)

      const msg = {
        message: `fiber bundle`
      }
      let appended = false

      this.#hoverFiber$.pipe(
        takeUntil(this.#destroy$),
        distinctUntilChanged((o, n) => o?.fibername === n?.fibername),
      ).subscribe(bundlename => {
        if (!bundlename) {
          remove(msg)
          appended = false
          return
        }
        if (!appended) {
          append(msg)
          appended = true
        }
        msg.message = `fiber bundle: ${bundlename.fibername}`
      })
    }
    if (this.#clickInterceptor) {
      let hovered: undefined|{fibername: string, index: number} = undefined
      const { deregister, register } = this.#clickInterceptor

      const clickInt = () => {
        if (!hovered) {
          return false
        }
        this.selectedFiber.setValue(hovered.fibername)
        return true
      }
      this.#destroycbs.push(() => deregister(clickInt))
      register(clickInt)
      this.#hoverFiber$.pipe(
        takeUntil(this.#destroy$),
      ).subscribe(_hovered => {
        hovered = _hovered
      })
    }

    this.view$.pipe(
      takeUntil(this.#destroy$),
      debounceTime(160),
    ).subscribe(({ uuid, bundlenames }) => {
      if (uuid && bundlenames.length > 0) {
        this.#loadOverview()
      }
    })

    this.#destroy$.subscribe(() => {
      for (const cb of this.#destroycbs) {
        cb()
      }
      this.#unloadOverview()
      this.#unloadDetail()
    })

    this.selectedFiber.valueChanges.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(value => {
      console.log("value", value)
      if (!value) {
        this.#unloadDetail()
        this.#loadOverview()
        return
      }
      this.#unloadOverview()
      this.#loadDetail(value)
    })
  }

  async #loadOverview() {
    this.#unloadOverview()
    const { bundlenames, uuid } = await this.view$.pipe(
      take(1)
    ).toPromise()

    const segments = bundlenames.map(v => v.index)
    const opt = {
      "type": "segmentation",
      "opacity": 1,
      "clType": "customlayer/nglayer",
      "segments": segments,
      "source": `precomputed://${GEOMSVC_HOST}/fiber_n/${uuid}/overview/ngskeleton`
    }

    this.#overviewLayer = (window as any).nehubaViewer.addLayer(opt, FIBER_OVERVIEW_LAYER_ID)

    setTimeout(() => {
      (window as any).nehubaViewer.setMeshesToLoad(segments, {
        name: FIBER_OVERVIEW_LAYER_ID
      })
    }, 1000)
  }

  #unloadOverview() {
    if (this.#overviewLayer) {
      (window as any).viewer.layerManager.removeManagedLayer(this.#overviewLayer)
      this.#overviewLayer = null
    }
  }

  #unloadDetail(){
    if (this.#detailLayer) {
      (window as any).viewer.layerManager.removeManagedLayer(this.#detailLayer)
      this.#detailLayer = null
    }
  }
  async #loadDetail(fibername: string){
    this.#unloadDetail()

    const { uuid } = await this.view$.pipe(
      take(1)
    ).toPromise()

    
    const opt = {
      "type": "segmentation",
      "opacity": 1,
      "clType": "customlayer/nglayer",
      "segments": [0],
      "source": `precomputed://${GEOMSVC_HOST}/fiber_n/${uuid}/detail/${fibername}/ngskeleton`
    }
    this.#detailLayer = (window as any).nehubaViewer.addLayer(opt, FIBER_DETAIL_LAYER_ID)
    
    setTimeout(() => {
      (window as any).nehubaViewer.setMeshesToLoad([0], {
        name: FIBER_DETAIL_LAYER_ID
      })
    }, 1000)
  }
}