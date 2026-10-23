import { CommonModule } from "@angular/common";
import { Component, inject, Input, viewChild } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { BehaviorSubject, combineLatest, EMPTY, from, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import { AngularMaterialModule } from "src/sharedModules";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor } from "src/util/injectionTokens";
import { TRXBase } from "../trx.base";
import { TRXGroupSelector } from "../trxGrpSel/trxGrpSel.component";
import { GEOMSVC_HOST, PaginatedResponse } from "../const"
import { SAPI } from "src/atlasComponents/sapi";
import { arrayEqual } from "src/util/array";

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

export class FiberFeatureCmp extends TRXBase{

  trxGrpSel = viewChild(TRXGroupSelector)

  #overviewUUID$ = new BehaviorSubject<string|null>(null)
  @Input()
  set overviewUUID(val: string){
    this.#overviewUUID$.next(val)
  }

  overviewSelection = new FormControl<string|null>(null)
  #masterFlagShow$ = new BehaviorSubject(true)

  overviewLevels$ = this.#overviewUUID$.pipe(
    switchMap(overviewUUID => {
      if (!overviewUUID) {
        return EMPTY
      }

      const url = `${GEOMSVC_HOST}/fiber_n/${overviewUUID}/overview`

      const getpage = (page: number) => from(
        fetch(`${url}?page=${page}`)
          .then(res => res.json() as Promise<PaginatedResponse<{name: string, path: string}>>)
      )

      return from(getpage(1)).pipe(
        switchMap(resp => SAPI.IteratePages(resp, getpage))
      )
    })
  )

  #destroy$ = inject(DestroyDirective).destroyed$

  #hoverInterceptor = inject(HOVER_INTERCEPTOR_INJECTOR, { optional: true }) as HoverInterceptor
  #clickInterceptor = inject(CLICK_INTERCEPTOR_INJECTOR, { optional: true }) as ClickInterceptor

  view$ = combineLatest([
    this.#overviewUUID$,
    this.uuid$,
    this.groupNames$,
    this.overviewLevels$,
  ]).pipe(
    map(([overviewUUID, uuid, bundlenames, overviewLevels]) => {
      return {
        overviewUUID, uuid,
        bundlenames,
        overviewLevels,
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
          return true
        }
        const grpSel = this.trxGrpSel()
        if (grpSel) {
          grpSel.selectGroup(hovered.fibername)
        }
        return false
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
      filter(v =>
        (v.overviewLevels || []).length > 0
        && (v.bundlenames || []).length > 0
      ),
      distinctUntilChanged(
        (o, n) => (
          o.overviewUUID === n.overviewUUID
          && o.bundlenames.length === n.bundlenames.length
        )
      ),
      debounceTime(160),
    ).subscribe(({ overviewLevels }) => {
      if (overviewLevels.length > 0) {
        this.overviewSelection.setValue(overviewLevels[0].path)
      }
    })

    combineLatest([
      this.#masterFlagShow$,
      this.view$,
      this.overviewSelection.valueChanges
    ]).pipe(
      takeUntil(this.#destroy$),
      filter(([ _showFlag, view, _sel ]) => {
        if (view.bundlenames.length <= 0) {
          return false
        }
        if (!view.overviewUUID) {
          return false
        }
        return true
      }),
      map(([ showFlag, view, sel ]) => {
        const { bundlenames, overviewUUID } = view
        const segments = bundlenames.map(v => v.index)
        return {
          segments,
          overviewUUID,
          sel,
          showFlag,
        }
      }),
      distinctUntilChanged((o, n) =>
        o.sel === n.sel
        && arrayEqual()(o.segments, n.segments)
        && o.overviewUUID === n.overviewUUID
        && o.showFlag === n.showFlag
      )
    ).subscribe(val => {
      this.#unloadOverview()
      const { overviewUUID, segments, sel, showFlag } = val
      if (sel && overviewUUID && showFlag) {
        this.#syncLoadOverview(overviewUUID, sel, segments)
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
    this.#masterFlagShow$.next(!groupname)
  }
  
  #syncLoadOverview(overviewUUID: string, currOvSel: string, segments: number[]){
    
    const opt = {
      "type": "segmentation",
      "opacity": 1,
      "clType": "customlayer/nglayer",
      "segments": segments,
      "source": `precomputed://${GEOMSVC_HOST}/fiber_n/${overviewUUID}/overview/${currOvSel}`
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
