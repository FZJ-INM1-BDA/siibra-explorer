import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BehaviorSubject, combineLatest, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, map, shareReplay, take, takeUntil, withLatestFrom } from "rxjs/operators";
import { AngularMaterialModule } from "src/sharedModules";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor } from "src/util/injectionTokens";
import { TRXBase } from "../trx.base";
import { TRXGroupSelector } from "../trxGrpSel/trxGrpSel.component";
import { arrayEqual } from "src/util/array";

const PROD_GEOMSVC_HOST = "https://geom-svc.apps.ebrains.eu"
const LOCAL_GEOMSVC_HOST = "http://localhost:5000"
const GEOMSVC_HOST = PROD_GEOMSVC_HOST || LOCAL_GEOMSVC_HOST

const FIBER_OVERVIEW_LAYER_ID = 'geomsvc-fiber-overview'

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
    TRXGroupSelector,
  ],
  hostDirectives: [
    DestroyDirective,
  ]
})

export class FiberFeatureCmp extends TRXBase {

  #destroy$ = inject(DestroyDirective).destroyed$
  
  #selectedGroup$ = new BehaviorSubject<string|null>(null)

  #hoverInterceptor = inject(HOVER_INTERCEPTOR_INJECTOR, { optional: true }) as HoverInterceptor
  #clickInterceptor = inject(CLICK_INTERCEPTOR_INJECTOR, { optional: true }) as ClickInterceptor

  view$ = combineLatest([
    this.uuid$,
    this.groupNames$,
    this.#selectedGroup$,
  ]).pipe(
    map(([uuid, bundlenames, selectedGroup]) => {
      return {
        uuid,
        bundlenames,
        selectedGroup,
      }
    }),
    shareReplay(1)
  )

  #overviewLayer: any

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
    super()
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
        this.#selectedGroup$.next(hovered.fibername)
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
      distinctUntilChanged(
        (o, n) => (
          o.uuid === n.uuid
          && arrayEqual()(o.bundlenames || [], n.bundlenames || [])
        )
      ),
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
      this.unloadGroup()
    })
  }

  handleGroupSelected(groupname: string|null){
    if (!!groupname) {
      this.#unloadOverview()
    } else {
      this.#loadOverview()
    }
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
}
