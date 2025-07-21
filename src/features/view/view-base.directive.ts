import { Directive, Inject, Input } from "@angular/core";
import { BehaviorSubject, combineLatest, concat, Observable, of } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, switchMap, take, withLatestFrom } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { Feature, SimpleCompoundFeature, SxplrRegion, SxplrTemplate, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { MetaV1Schema, PathReturn } from "src/atlasComponents/sapi/typeV3";
import { isVoiData, notQuiteRight } from "../guards";
import { DARKTHEME } from "src/util/injectionTokens";
import { ExperimentalService } from "src/experimental/experimental.service";

type ExtraParams = Partial<{
  regions: SxplrRegion[]
  space: SxplrTemplate
}>

type PlotlyResponse = PathReturn<"/feature/{feature_id}/plotly">

/**
 * experimental
 * remove once cpn is properly introduced
 * (with transform.json and meta.json etc)
 */
const BIGBRAIN_XZ = [
  [-70.677, 62.222],
  [-70.677, -58.788],
  [68.533, -58.788],
  [68.533, 62.222],
]
type _Voi = VoiFeature

@Directive({
  selector: '[feature-view-base]',
  exportAs: 'featureViewBase'
})
export class FeatureViewBase {

  busy$ = new BehaviorSubject<boolean>(false)

  #feature$ = new BehaviorSubject<Feature|SimpleCompoundFeature>(null)
  @Input()
  set feature(val: Feature|SimpleCompoundFeature) {
    this.#feature$.next(val)
  }

  #extraParams = new BehaviorSubject<ExtraParams>(null)
  @Input()
  set extraParams(val: ExtraParams){
    this.#extraParams.next(val)
  }

  #featureId = this.#feature$.pipe(
    map(f => f.id)
  )

  #featureDetail$ = this.#featureId.pipe(
    switchMap(fid => this.sapi.getV3FeatureDetailWithId(fid)),
  )
  
  #loadingDetail$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(true),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(() => false)
      )
    ))
  )


  #warnings$ = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(notQuiteRight),
      )
    ))
  )
  
  #isConnectivity$ = this.#feature$.pipe(
    map(v => v.category === "connectivity")
  )

  #additionalParams$: Observable<Record<string, string>> = this.#isConnectivity$.pipe(
    withLatestFrom(
      this.#extraParams.pipe(
        map(params => params?.regions)
      )
    ),
    map(([ isConnectivity, selectedRegions ]) => isConnectivity
    ? {"regions": selectedRegions.map(r => r.name).join(" ")}
    : {} )
  )

  #plotlyInput$ = combineLatest([
    this.#featureId,
    this.darktheme$,
    this.#additionalParams$,
  ]).pipe(
    debounceTime(16),
    map(([ id, darktheme, additionalParams ]) => ({ id, darktheme, additionalParams })),
    distinctUntilChanged((o, n) => o.id === n.id && o.darktheme === n.darktheme),
    shareReplay(1),
  )
  
  #plotly$: Observable<PlotlyResponse> = this.#plotlyInput$.pipe(
    switchMap(({ id, darktheme, additionalParams }) => {
      if (!id) {
        return of(null)
      }
      return concat(
        of(null),
        this.sapi.getFeaturePlot(
          id,
          {
            template: darktheme ? 'plotly_dark' : 'plotly_white',
            ...additionalParams
          }
        ).pipe(
          catchError(() => of(null))
        )
      )
    }),
    shareReplay(1),
  )
    
  #loadingPlotly$ = this.#plotlyInput$.pipe(
    switchMap(() => concat(
      of(true),
      this.#plotly$.pipe(
        map(() => false)
      )
    )),
  )
   
  #detailLinks = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        catchError(() => of(null as null)),
        map(val => (val?.link || []).map(l => l.href))
      )
    ))
  ) 

  additionalLinks$ = this.#detailLinks.pipe(
    distinctUntilChanged((o, n) => o.length == n.length),
    withLatestFrom(this.#feature$),
    map(([links, feature]) => {
      const set = new Set((feature.link || []).map(v => v.href))
      return links.filter(l => !set.has(l))
    })
  )

  downloadLink$ = this.sapi.sapiEndpoint$.pipe(
    switchMap(endpoint => this.#featureId.pipe(
      map(featureId => `${endpoint}/feature/${featureId}/download`),
      shareReplay(1)
    ))
  )
  #featureDesc$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(null as string),
      this.#featureDetail$.pipe(
        map(v => v?.desc),
        catchError((err) => {
          let errortext = 'Error fetching feature instance'

          if (err.error instanceof Error) {
            errortext += `:\n\n${err.error.toString()}`
          } else {
            errortext += '!'
          }
          
          return of(errortext)
        }),
      )
    ))
  )

  #featureContributors$ = concat(
    of([] as string[]),
    this.#featureDetail$.pipe(
      map(f => f.contributors)
    )
  )

  #derivedFeatProps$ = combineLatest([
    this.#warnings$,
    this.additionalLinks$,
    this.downloadLink$,
    this.#featureDesc$,
    this.#featureContributors$,
  ]).pipe(
    map(([ warnings, additionalLinks, downloadLink, desc, contributors ]) => {
      return {
        warnings, additionalLinks, downloadLink, desc, contributors
      }
    })
  )


  #baseView$ = combineLatest([
    this.#feature$,
    combineLatest([
      this.#loadingDetail$,
      this.#loadingPlotly$,
      this.busy$,
    ]).pipe(
      map(flags => flags.some(f => f))
    ),
    this.#derivedFeatProps$
  ]).pipe(
    map(([ feature, busy, { warnings, additionalLinks, downloadLink, desc, contributors } ]) => {
      return {
        featureId: feature.id,
        name: feature.name,
        links: feature.link,
        category: feature.category === 'Unknown category'
        ? `Feature: other`
        : `Feature: ${feature.category}`,
        busy,
        warnings,
        additionalLinks,
        downloadLink,
        desc,
        contributors,
      }
    })
  )

  #voi$: Observable<VoiFeature> = this.#feature$.pipe(
    switchMap(() => concat(
      of(null),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(val => {
          if (isVoiData(val)) {
            return val
          }
          return null
        })
      )
    ))
  )
  #specialView$ = combineLatest([
    concat(
      of(null as VoiFeature),
      this.#voi$
    ).pipe(
      switchMap(async voi => {
        if (!voi) {
          return { voi, additionalVois: [] as _Voi[] }
        }
        return await this.#getAdditionalVois(voi)
        
      })
    ),
    concat(
      of(null as PlotlyResponse),
      this.#plotly$,
    ),
    this.#extraParams
  ]).pipe(
    map(([ { voi, additionalVois }, plotly, param ]) => {
      return {
        voi, plotly, cmpFeatElmts: null, selectedTemplate: param?.space, additionalVois
      }
    })
  )

  view$ = combineLatest([
    this.#baseView$,
    this.#specialView$,
    this.expmtalSvc.showExperimentalFlag$
  ]).pipe(
    map(([baseview, specialview, showExperimentalFlag]) => {
      
      return {
        ...baseview,
        ...specialview,
        showExperimentalFlag
      }
    })
  )

  constructor(
    protected sapi: SAPI,
    @Inject(DARKTHEME) protected darktheme$: Observable<boolean>,
    private expmtalSvc: ExperimentalService,
  ){

  }

  async #getAdditionalVois(voi: VoiFeature){
    const exmptFlag = await this.expmtalSvc.showExperimentalFlag$.pipe(
      take(1)
    ).toPromise()
    const additionalVois: _Voi[] = []
    if (!exmptFlag) {
      return { voi, additionalVois }
    }
    const found = /B20_([0-9]{4})/.exec(voi?.ngVolume?.url || '')
    if (!found) {
      return { voi, additionalVois }
    }
    try {
      
      const sectionId = parseInt(found[1])
      const realYDis = (sectionId * 2e4 - 70010000) / 1e6
      const url = `https://zam12230.jsc.fz-juelich.de/gpuvm-deploy/cuda/bb1micron/B20_${sectionId}.tif::pipelines/cpn.json`
      const resp = await fetch(`${url}/meta.json`)
      const meta: MetaV1Schema = await resp.json()
      
      meta.transform[1][3] -= 40e3 
      additionalVois.push({
        bbox: {
          center: [0, realYDis, 0],
          minpoint: [-70.677, realYDis, -58.788],
          maxpoint: [68.533, realYDis, 62.222],
          spaceId: "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588"
        },
        ngVolume: {
          info: null,
          transform: meta.transform,
          // replace with /cpn later
          url: `https://zam12230.jsc.fz-juelich.de/gpuvm-deploy/cuda/bb1micron/B20_${sectionId}.tif::pipelines/cpn.json`,
          meta: {
            preferredColormap: ["rgba (4 channel)"],
            version: 1,
            bestViewPoints: [{
              type: "enclosed",
              points: BIGBRAIN_XZ.map(([x, z]) => ({
                type: "point",
                value: [x, realYDis - 1e-2, z]
              }))
            }]
          },
          format: "neuroglancer-precomputed",
          insertIndex: 2
        },
        id: `${sectionId}-cpn`,
        name: `Contour Proposal Network`,
        contributors: [
          `Eric Upschulte`,
          `Alexander Oberstraß`
        ],
        desc: `Contour Proposal Network`,
        link: [
          {
            href: `https://huggingface.co/spaces/ericup/celldetection`,
            text: `huggingface.co/spaces/ericup/celldetection`
          },
          {
            href: `https://github.com/FZJ-INM1-BDA/celldetection`,
            text: `github.com/FZJ-INM1-BDA/celldetection`
          },
          {
            href: `https://doi.org/10.1016/j.media.2022.102371`,
            text: `10.1016/j.media.2022.102371`
          },
          {
            href: `https://proceedings.mlr.press/v212/upschulte23a.html`,
            text: `Uncertainty-Aware Contour Proposal Networks for Cell Segmentation in Multi-Modality High-Resolution Microscopy Images`
          },
        ]
      })
      voi.ngVolume.url = `https://zam12230.jsc.fz-juelich.de/mvp-tiamat/bb1micron/B20_${sectionId}.tif::pipelines/bb1mu.json`
    } catch (e) {
      console.warn("Parse voi error:", e)
    }
    return { voi, additionalVois }
  }
}