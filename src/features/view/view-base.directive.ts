import { Directive, Inject, Input } from "@angular/core";
import { BehaviorSubject, combineLatest, concat, from, Observable, of } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, map, scan, shareReplay, startWith, switchMap, withLatestFrom } from "rxjs/operators";
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

async function findViewAsCpn(voi: Feature): Promise<VolumesViewAs[]> {
  if (!isVoiData(voi)) {
    return []
  }
  const found = /B20_([0-9]{4})/.exec(voi?.ngVolume?.url || '')
  if (!found) {
    return []
  }
  const baseUrl = "https://gateway.brainatlas.eu"
  const sectionId = parseInt(found[1])
  const sectionIdStr = sectionId.toString().padStart(4, '0')
  const realYDis = (sectionId * 2e4 - 70010000) / 1e6
  const url = `${baseUrl}/gpuvm-deploy/cuda/bb1micron/B20_${sectionIdStr}.tif::pipelines/cpn.json`
  const resp = await fetch(`${url}/meta.json`)
  const meta: MetaV1Schema = await resp.json()
  if (!meta.transform) {
    return []
  }
  meta.transform[1][3] -= 40e3
  return [
    {
      label: "Contour proposal network",
      type: "volumes",
      volumes: [
        voi.ngVolume,
        {
          info: null,
          transform: meta.transform,
          // replace with /cpn later
          url: `${baseUrl}/gpuvm-deploy/cuda/bb1micron/B20_${sectionIdStr}.tif::pipelines/cpn.json`,
          meta: {
            preferredColormap: ["rgba (4 channel)"],
            version: 1,
            bestViewPoints: [{
              type: "enclosed",
              points: BIGBRAIN_XZ.map(([x, z]) => ({
                type: "point",
                value: [x, realYDis, z]
              }))
            }]
          },
          format: "neuroglancer-precomputed",
          insertIndex: 2
        }
      ],
      contributors: [
        `Eric Upschulte`,
        `Alexander Oberstraß`
      ],
      title: 'Contour proposal network',
      desc: "This visualization shows the overlay of CPN classification on top of the 1um histological scan.",
      links: [
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
    }
  ]
}

type ViewAsLabel = {
  label: string
  title?: string
  desc?: string
  contributors?: string[]
  links?: { href: string, text: string }[]
}

type PlotlyViewAs = {
  type: "plotly"
  data: PlotlyResponse
} & ViewAsLabel

type VolumesViewAs = {
  type: "volumes"
  volumes: VoiFeature['ngVolume'][]
} & ViewAsLabel

type BaseGeomsvcViewAs = {
  type: "geomsvc"
  url: string
} & ViewAsLabel

type TmpGeomSvcFiber = {
  type: "fiber"
  url: string
} & ViewAsLabel

export type ViewAs = VolumesViewAs | PlotlyViewAs | BaseGeomsvcViewAs | TmpGeomSvcFiber


@Directive({
  selector: '[feature-view-base]',
  exportAs: 'featureViewBase'
})
export class FeatureViewBase {

  public BUSY_NS = {
    ADD_VOI: "ADD_VOI"
  } as const

  /**
   * Casts an untyped template value (e.g. the `any`-typed value of a
   * `<mat-select>`) to the {@link ViewAs} union so the template type-checker
   * can narrow it under `@switch (opt.type)`.
   */
  asViewAs(opt: unknown): ViewAs {
    return opt as ViewAs
  }

  isBaseGeomSvcViewAs(opt: unknown): opt is BaseGeomsvcViewAs {
    return (opt as any)['type'] === "geomsvc"
  }

  getGeomViewAs(feat: Feature) {
    return this.sapi.v3Get("/spatial/geometry/{uuid}", {
      path: {
        uuid: feat.id
      }
    })
  }

  nsBusy$ = new BehaviorSubject<Record<string, boolean>>({ [this.BUSY_NS.ADD_VOI]: true })
  busy$ = this.nsBusy$.pipe(
    scan((acc, curr) => ({ ...acc, ...curr })),
    map(record => Object.values(record).some(flag => !!flag))
  )

  setBusy(namespace: string, flag: boolean) {
    this.nsBusy$.next({
      [namespace]: flag
    })
  }

  #inputFeature$ = new BehaviorSubject<Feature | SimpleCompoundFeature | null>(null)
  #feature$ = this.#inputFeature$.pipe(
    switchMap(feat => {
      if (!feat) {
        return of(null)
      }
      return this.sapi.getV3FeatureDetailWithId(feat.id)
    }),
    shareReplay(1),
  )
  exportedFeature$ = this.#feature$
  @Input()
  set feature(val: Feature | SimpleCompoundFeature) {
    this.#inputFeature$.next(val)
  }

  #extraParams = new BehaviorSubject<ExtraParams>(null)
  @Input()
  set extraParams(val: ExtraParams) {
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
    map(([isConnectivity, selectedRegions]) => isConnectivity
      ? { "regions": selectedRegions.map(r => r.name).join(" ") }
      : {})
  )

  #plotlyInput$ = combineLatest([
    this.#featureId,
    this.darktheme$,
    this.#additionalParams$,
  ]).pipe(
    debounceTime(16),
    map(([id, darktheme, additionalParams]) => ({ id, darktheme, additionalParams })),
    distinctUntilChanged((o, n) => o.id === n.id && o.darktheme === n.darktheme),
    shareReplay(1),
  )

  #plotly$: Observable<PlotlyResponse | null> = this.#plotlyInput$.pipe(
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

  #viewAs$ = combineLatest([
    this.#plotly$.pipe(
      map(data => {
        if (data) {
          return [{ data, type: "plotly", label: "Plot" }] as PlotlyViewAs[]
        }
        return []
      })
    ),
    this.#feature$.pipe(
      map(feat => {
        if (isVoiData(feat)) {
          return [{
            label: "Image",
            type: "volumes",
            volumes: [feat["ngVolume"]]
          }] as VolumesViewAs[]
        }
        return []
      })
    ),
    this.#feature$.pipe(
      switchMap(feat => {
        if (!isVoiData(feat)) {
          return of([])
        }
        return from(findViewAsCpn(feat))
      })
    ),
    this.#feature$.pipe(
      switchMap(feat => {
        if (!feat) {
          return of([])
        }
        if (feat.id === "494818fa-9126-4432-a167-52ff02534a8b--icbm152") {
          return of([
            {
              type: "fiber",
              label: "test fiber",
              url: "dp-d-494818fa-9126-4432-a167-52ff02534a8b/sub-chenonceau/derivatives/sub-chenonceau_space-MNI152NLin2009cAsym_model-global-tractography_desc-deep-white-matter-atlas.trx"
            } as TmpGeomSvcFiber
          ])
        }
        return this.getGeomViewAs(feat).pipe(
          map(res => {
            const geomSvcDir = res['https://schema.brainatlas.eu/apps.ebrains.eu/geom-svc/directory']
            return geomSvcDir['ingArtfactsUrls'].map(url => {
              return {
                url,
                type: "geomsvc",
                label: `Loading ...`
              } as BaseGeomsvcViewAs
            })
          }),
          catchError(() => of([]))
        )
      }),
    )
  ]).pipe(
    startWith([] as ViewAs[][]),
    map(opts => [
      ...opts.flatMap(v => v),
      // {
      //   label: "debug fiber",
      //   type: "fiber",
      //   uuid: "foobar",
      // } as FiberViewAs
    ])
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
    map(([warnings, additionalLinks, downloadLink, desc, contributors]) => {
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
    map(([feature, busy, { warnings, additionalLinks, downloadLink, desc, contributors }]) => {
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

  view$ = combineLatest([
    this.#baseView$,
    this.expmtalSvc.showExperimentalFlag$,
    this.#viewAs$
  ]).pipe(
    map(([baseview, showExperimentalFlag, viewAs]) => {
      return {
        ...baseview,
        viewAs,
        showExperimentalFlag
      }
    })
  )

  constructor(
    protected sapi: SAPI,
    @Inject(DARKTHEME) protected darktheme$: Observable<boolean>,
    private expmtalSvc: ExperimentalService,
  ) {

  }

}