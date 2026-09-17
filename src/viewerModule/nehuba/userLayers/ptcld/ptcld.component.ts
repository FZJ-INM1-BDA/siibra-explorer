import { CommonModule } from "@angular/common";
import { Component, inject, Input, OnChanges, SimpleChanges } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { select, Store } from "@ngrx/store";
import { concat, EMPTY, from, of } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil } from "rxjs/operators";
import { AnnotationLayer, TNgAnnotationPoint } from "src/atlasComponents/annotations";
import { IDS } from "src/atlasComponents/sapi";
import { AngularMaterialModule } from "src/sharedModules";
import { atlasAppearance, atlasSelection } from "src/state";
import { arrayEqual } from "src/util/array";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { getShader, QuickHash } from "src/util/fn";

const GEOMSVC_HOST = "https://geom-svc.apps.ebrains.eu"
const COUNT_THRESHOLD = 1e6
const PTCLD_CONST = "ptcldingsvc"
const tripletEqual = arrayEqual<number>((v0, v1) => v0 === v1, true)

const LOADING_STATE = {
  LOADING: "LOADING",
  ERROR: "ERROR"
} as const

@Component({
  selector: 'ptcld-ui',
  templateUrl: './ptcld.template.html',
  styleUrls: [
    './ptcld.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
  ],
  hostDirectives: [
    DestroyDirective,
  ]
})

export class PtcldUI implements OnChanges{

  formCtrl = new FormGroup({
    kde: new FormControl(false),
    rtree: new FormControl(false),
    multires: new FormControl(false),
  })

  LOADING_STATE = LOADING_STATE

  #ondestroy$ = inject(DestroyDirective).destroyed$

  @Input()
  bucketname: string | undefined

  @Input()
  fname: string | undefined

  #basehash: string |undefined
  ngOnChanges(_changes: SimpleChanges): void {
    this.#basehash = QuickHash.GetHash(`${this.bucketname}/${this.fname}`)
  }
  #pointToPoint(point: [number, number, number], useId=null): TNgAnnotationPoint{
    const id = useId || `${PTCLD_CONST}:${JSON.stringify(point)}`
    return {
      id,
      point: point.map(v => v*1e6) as [number, number, number],
      type: "point"
    }
  }

  #annLayer: AnnotationLayer|undefined

  #currAnnotIds: string[] = []

  #currViewportChanged$ = this.store.pipe(
    select(atlasSelection.selectors.currentViewport),
    distinctUntilChanged((o, n) => {
      if (!o) {
        return false
      }
      if (!n) {
        return false
      }
      if (n.spaceId !== o.spaceId) {
        return false
      }
      return tripletEqual(o.minpoint, n.minpoint) && tripletEqual(o.maxpoint, n.maxpoint)
    }),
    shareReplay(1),
  )

  #currViewportDebouncedChanged$ = this.#currViewportChanged$.pipe(
    debounceTime(160)
  )

  ptCount$ = this.#currViewportChanged$.pipe(
    switchMap(() => concat(
      of(LOADING_STATE.LOADING),
      this.#currViewportDebouncedChanged$.pipe(
        switchMap(vp => {

          if (vp?.spaceId !== IDS.TEMPLATES.AMBA_CCF_V3) {
            return of(0)
          }
          if (!this.bucketname || !this.fname) {
            return of(0)
          }
          const url = new URL(`/ptcld/${this.bucketname}/${encodeURIComponent(this.fname)}/stat`, GEOMSVC_HOST)
          url.searchParams.set("bbox_min", vp.minpoint.map(v => v).join(","))
          url.searchParams.set("bbox_max", vp.maxpoint.map(v => v).join(","))
          return from(fetch(url).then(res => res.json()).then(res => res['count'] as number))
        })
      )
    )),
    shareReplay(1),
  )

  #addMultires(){
    const mrLayername = `ingsvc-ptcld-multires-${this.#basehash}`
    const url = `https://${GEOMSVC_HOST}/ptcld/${this.bucketname}/${this.fname}/multires`
    
    this.store.dispatch(
      atlasAppearance.actions.addCustomLayers({
        customLayers: [
          {
            id: mrLayername,
            clType: "customlayer/nglayer",
            source: `precomputed://${url}`,
            legacySpecFlag: 'old',
            type: 'annotation'
          }
        ]
      })
    )
  }

  #rmMultires(){
    const mrLayername = `ingsvc-ptcld-multires-${this.#basehash}`
    this.store.dispatch(
      atlasAppearance.actions.removeCustomLayers({
        customLayers: [
          {
            id: mrLayername
          }
        ]
      })
    )
  }

  #meta: Record<string, any>|undefined
  async #addKde(){
    const kdeLayername = `ingsvc-ptcld-kde-${this.#basehash}`
    const kdeBaseUrl = `${GEOMSVC_HOST}/ptcld/${this.bucketname}/${this.fname}/kde`
    if (!this.#meta) {
      this.#meta = await (await fetch(`${kdeBaseUrl}/meta.json`)).json()
    }

    const shader = getShader({
      colormap: 'magma',
    })
    
    this.store.dispatch(
      atlasAppearance.actions.addCustomLayers({
        customLayers: [
          {
            id: kdeLayername,
            clType: "customlayer/nglayer",
            source: `precomputed://${kdeBaseUrl}`,
            legacySpecFlag: 'old',
            transform: this.#meta!.transform,
            shader: shader,
            type: 'image'
          }
        ]
      })
    )
  }
  #removeKde(){
    const kdeLayername = `ingsvc-ptcld-kde-${this.#basehash}`
    this.store.dispatch(
      atlasAppearance.actions.removeCustomLayers({
        customLayers: [
          {
            id: kdeLayername
          }
        ]
      })
    )
  }

  constructor(private store: Store) {
    this.#ondestroy$.subscribe(() => {
      this.#annLayer?.dispose()
      this.#removeKde()
      this.#rmMultires()
    })

    this.formCtrl.controls.kde.valueChanges.pipe(
      takeUntil(this.#ondestroy$),
      distinctUntilChanged()
    ).subscribe(async flag => {
      if (flag) {
        this.#addKde()
      } else {
        this.#removeKde()
      }
    })

    this.formCtrl.controls.multires.valueChanges.pipe(
      takeUntil(this.#ondestroy$),
      distinctUntilChanged()
    ).subscribe(async flag => {
      if (flag) {
        this.#addMultires()
      } else {
        this.#rmMultires()
      }
    })

    this.formCtrl.controls.rtree.valueChanges.pipe(
      takeUntil(this.#ondestroy$),
      distinctUntilChanged(),
      filter(flag => !flag)
    ).subscribe(() => {
      this.#annLayer?.dispose()
    })
    
    this.formCtrl.controls.rtree.valueChanges.pipe(
      takeUntil(this.#ondestroy$),
      distinctUntilChanged(),
      switchMap(flag => 
        flag
        ? this.#currViewportDebouncedChanged$.pipe(
            switchMap(vp => this.ptCount$.pipe(
              map(count => {
                return { count, vp }
              })
            ))
          )
        : EMPTY
      )
    ).subscribe(async ({ vp, count }) => {
      
      if (typeof count !== "number") {
        return
      }
      
      
      if (!count) {
        return
      }
      
      if (count > COUNT_THRESHOLD) {
        return
      }
      if (!this.fname) {
        return
      }
      
      const url = new URL(`/ptcld/${this.bucketname}/${encodeURIComponent(this.fname)}/geometry`, GEOMSVC_HOST)
      url.searchParams.set("bbox_min", vp.minpoint.join(","))
      url.searchParams.set("bbox_max", vp.maxpoint.join(","))
      const arrOfArr = await (await fetch(url)).arrayBuffer()
      
      // cleanup
      this.#annLayer?.dispose()
      this.#annLayer = AnnotationLayer.Get(
        PTCLD_CONST,
        "#ffcc00"
      )

      const f32arr = new Float32Array(arrOfArr)

      if (f32arr.length % 3 !== 0) {
        console.error(`${f32arr.length} does not divide into 3`)
        return
      }

      if ((f32arr.length / 3) !== count) {
        console.error(`Expected ${count}, but got ${f32arr.length / 3}`)
        return
      }
      
      const annots = []
      for (let idx = 0; idx < count; idx ++ ){
        const arr = [
          f32arr[idx * 3],
          f32arr[idx * 3 + 1],
          f32arr[idx * 3 + 2],
        ] as [number, number, number]
        const pt = this.#pointToPoint(arr)
        annots.push(pt)
      }

      await this.#annLayer?.addAnnotation(annots)
      
    })
  }
}
