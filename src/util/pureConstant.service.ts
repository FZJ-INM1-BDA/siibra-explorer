import { Inject, Injectable, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, Subscription, of, forkJoin, combineLatest, from } from "rxjs";
import { viewerConfigSelectorUseMobileUi } from "src/services/state/viewerConfig.store.helper";
import { shareReplay, tap, scan, catchError, filter, switchMap, map, distinctUntilChanged, mapTo } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { viewerStateFetchedTemplatesSelector, viewerStateSetFetchedAtlases } from "src/services/state/viewerState.store.helper";
import { LoggingService } from "src/logging";
import { viewerStateFetchedAtlasesSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { BS_ENDPOINT, BACKENDURL } from "src/util/constants";
import { flattenReducer } from 'common/util'
import { IVolumeTypeDetail, TAtlas, TId, TParc, TRegionDetail, TRegionSummary, TSpaceFull, TSpaceSummary, TVolumeSrc } from "./siibraApiConstants/types";
import { MultiDimMap, recursiveMutate, mutateDeepMerge } from "./fn";
import { patchRegions } from './patchPureConstants'
import { environment } from "src/environments/environment";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TTemplateImage } from "./interfaces";

export const SIIBRA_API_VERSION_HEADER_KEY='x-siibra-api-version'
export const SIIBRA_API_VERSION = '0.1.7'

const validVolumeType = new Set([
  'neuroglancer/precomputed',
  'neuroglancer/precompmesh',
  'threesurfer/gii',
  'threesurfer/gii-label',
])

function getNgId(atlasId: string, tmplId: string, parcId: string, regionKey: string){
  const proxyId = MultiDimMap.GetProxyKeyMatch(atlasId, tmplId, parcId, regionKey)
  if (proxyId) return proxyId
  return '_' + MultiDimMap.GetKey(atlasId, tmplId, parcId, regionKey)
}

function parseId(id: TId){
  if (typeof id === 'string') return id
  return `${id.kg.kgSchema}/${id.kg.kgId}`
}

type THasId = {
  ['@id']: string
  name: string
}

type TIAVAtlas = {
  templateSpaces: ({ availableIn: THasId[] } & THasId)[]
  parcellations: ({
    availableIn: THasId[]
    baseLayer: boolean
    '@version': {
      name: string
      '@next': string
      '@previous': string
      '@this': string
    }
  } & THasId)[]
} & THasId

export const spaceMiscInfoMap = new Map([
  ['minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588', {
    name: 'bigbrain',
    scale: 1,
  }],
  ['minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2', {
    name: 'icbm2009c',
    scale: 1,
  }],
  ['minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992', {
    name: 'colin27',
    scale: 1,
  }],
  ['minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9', {
    name: 'allen-mouse',
    scale: 0.1,
  }],
  ['minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8', {
    name: 'waxholm',
    scale: 0.1,
  }],
])

function getNehubaConfig(space: TSpaceFull) {

  const darkTheme = space.src_volume_type === 'mri'
  const { scale } = spaceMiscInfoMap.get(space.id) || { scale: 1 }
  const backgrd = darkTheme
    ? [0,0,0,1]
    : [1,1,1,1]

  const rmPsp = darkTheme
    ? {"mode":"<","color":[0.1,0.1,0.1,1]}
    :{"color":[1,1,1,1],"mode":"=="}
  const drawSubstrates = darkTheme
    ? {"color":[0.5,0.5,1,0.2]}
    : {"color":[0,0,0.5,0.15]}
  const drawZoomLevels = darkTheme
    ? {"cutOff":150000 * scale }
    : {"cutOff":200000 * scale,"color":[0.5,0,0,0.15] }

  // enable surface parcellation
  // otherwise, on segmentation selection, the unselected meshes will also be invisible
  const surfaceParcellation = space.id === 'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992'
  return {
    "configName": "",
    "globals": {
      "hideNullImageValues": true,
      "useNehubaLayout": {
        "keepDefaultLayouts": false
      },
      "useNehubaMeshLayer": true,
      "rightClickWithCtrlGlobal": false,
      "zoomWithoutCtrlGlobal": false,
      "useCustomSegmentColors": true
    },
    "zoomWithoutCtrl": true,
    "hideNeuroglancerUI": true,
    "rightClickWithCtrl": true,
    "rotateAtViewCentre": true,
    "enableMeshLoadingControl": true,
    "zoomAtViewCentre": true,
    // "restrictUserNavigation": true,
    "dataset": {
      "imageBackground": backgrd,
      "initialNgState": {
        "showDefaultAnnotations": false,
        "layers": {},
        "navigation": {
          "zoomFactor": 350000 * scale,
        },
        "perspectiveOrientation": [
          0.3140767216682434,
          -0.7418519854545593,
          0.4988985061645508,
          -0.3195493221282959
        ],
        "perspectiveZoom": 1922235.5293810747 * scale
      }
    },
    "layout": {
      "useNehubaPerspective": {
        "perspectiveSlicesBackground": backgrd,
        "removePerspectiveSlicesBackground": rmPsp,
        "perspectiveBackground": backgrd,
        "fixedZoomPerspectiveSlices": {
          "sliceViewportWidth": 300,
          "sliceViewportHeight": 300,
          "sliceZoom": 563818.3562426177 * scale,
          "sliceViewportSizeMultiplier": 2
        },
        "mesh": {
          "backFaceColor": backgrd,
          "removeBasedOnNavigation": true,
          "flipRemovedOctant": true,
          surfaceParcellation
        },
        "centerToOrigin": true,
        "drawSubstrates": drawSubstrates,
        "drawZoomLevels": drawZoomLevels,
        "restrictZoomLevel": {
          "minZoom": 1200000 * scale,
          "maxZoom": 3500000 * scale
        }
      }
    }
  }
  
}

@Injectable({
  providedIn: 'root'
})

export class PureContantService implements OnDestroy{
  
  private subscriptions: Subscription[] = []
  public repoUrl = `https://github.com/HumanBrainProject/interactive-viewer`
  public supportEmailAddress = `support@ebrains.eu`
  public docUrl = `https://interactive-viewer.readthedocs.io/en/latest/`

  public showHelpSupportText: string = `Did you encounter an issue?
Send us an email: <a target = "_blank" href = "mailto:${this.supportEmailAddress}">${this.supportEmailAddress}</a>

Raise/track issues at github repo: <a target = "_blank" href = "${this.repoUrl}">${this.repoUrl}</a>
`

  public useTouchUI$: Observable<boolean>
  public darktheme$: Observable<boolean>

  public totalAtlasesLength: number

  public allFetchingReady$: Observable<boolean>

  private atlasParcSpcRegionMap = new MultiDimMap()

  private _backendUrl = (BACKENDURL && `${BACKENDURL}/`.replace(/\/\/$/, '/')) || `${window.location.origin}${window.location.pathname}`
  get backendUrl() {
    console.warn(`something is using backendUrl`)
    return this._backendUrl
  }

  public getRegionDetail(atlasId: string, parcId: string, spaceId: string, region: any) {
    return this.http.get<TRegionDetail>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/parcellations/${encodeURIComponent(parcId)}/regions/${encodeURIComponent(region.name)}`,
      {
        params: {
          'space_id': spaceId
        },
        responseType: 'json'
      }
    )
  }

  private patchRegions$ = forkJoin(
    patchRegions.map(patch => from(patch))
  ).pipe(
    shareReplay(1)
  )

  private getRegions(atlasId: string, parcId: string, spaceId: string){
    return this.http.get<TRegionSummary[]>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/parcellations/${encodeURIComponent(parcId)}/regions`,
      {
        params: {
          'space_id': spaceId
        },
        responseType: 'json'
      }
    ).pipe(
      switchMap(regions => this.patchRegions$.pipe(
        map(patchRegions => {
          for (const p of patchRegions) {
            if (
              p.targetParcellation !== '*'
              && Array.isArray(p.targetParcellation)
              && p.targetParcellation.every(p => p["@id"] !== parcId)
            ) {
              continue
            }
            if (
              p.targetSpace !== '*'
              && Array.isArray(p.targetSpace)
              && p.targetSpace.every(sp => sp['@id'] !== spaceId)
            ) {
              continue
            }

            recursiveMutate(
              regions,
              r => r.children || [],
              region => {

                if (p["@type"] === 'julich/siibra/append-region/v0.0.1') {
                  if (p.parent['name'] === region.name) {
                    if (!region.children) region.children = []
                    region.children.push(
                      p.payload as TRegionSummary
                    )
                  }
                }
                if (p['@type'] === 'julich/siibra/patch-region/v0.0.1') {
                  if (p.target['name'] === region.name) {
                    mutateDeepMerge(
                      region,
                      p.payload
                    )
                  }
                }
              },
              true
            )
          }
          return regions
        })
      ))
    )
  }

  public getParcs(atlasId: string){
    return this.http.get<TParc[]>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/parcellations`,
      { responseType: 'json' }
    )
  }

  private httpCallCache = new Map<string, Observable<any>>()

  private getParcDetail(atlasId: string, parcId: string) {
    return this.http.get<TParc>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/parcellations/${encodeURIComponent(parcId)}`,
      { responseType: 'json' }
    )
  }

  public getSpaces(atlasId: string){
    return this.http.get<TSpaceSummary[]>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/spaces`,
      { responseType: 'json' }
    )
  }

  private getSpaceDetail(atlasId: string, spaceId: string) {
    return this.http.get<TSpaceFull>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/spaces/${encodeURIComponent(spaceId)}`,
      { responseType: 'json' }
    )
  }

  private getSpacesAndParc(atlasId: string): Observable<{ templateSpaces: TSpaceFull[], parcellations: TParc[] }> {
    const cacheKey = `getSpacesAndParc::${atlasId}`
    if (this.httpCallCache.has(cacheKey)) return this.httpCallCache.get(cacheKey)
    
    const spaces$ = this.getSpaces(atlasId).pipe(
      switchMap(spaces => spaces.length > 0
        ? forkJoin(
          spaces.map(space => this.getSpaceDetail(atlasId, parseId(space.id)))
        )
        : of([]))
    )
    const parcs$ = this.getParcs(atlasId).pipe(
      // need not to get full parc data. first level gets all data
      // switchMap(parcs => forkJoin(
      //   parcs.map(parc => this.getParcDetail(atlasId, parseId(parc.id)))
      // ))
    )
    const returnObs = forkJoin([
      spaces$,
      parcs$,
    ]).pipe(
      map(([ templateSpaces, parcellations ]) => {
        /**
         * select only parcellations that contain renderable volume(s)
         */
        const filteredParcellations = parcellations.filter(p => {
          return p._dataset_specs.some(spec => spec["@type"] === 'fzj/tmp/volume_type/v0.0.1' && validVolumeType.has(spec.volume_type))
        })

        /**
         * remove parcellation versions that are marked as deprecated
         * and assign prev/next id accordingly
         */
        for (const p of filteredParcellations) {
          if (!p.version) continue
          if (p.version.deprecated) {
            const prevId = p.version.prev
            const nextId = p.version.next

            const prev = prevId && filteredParcellations.find(p => parseId(p.id) === prevId)
            const next = nextId && filteredParcellations.find(p => parseId(p.id) === nextId)

            const newPrevId = prev && parseId(prev.id)
            const newNextId = next && parseId(next.id)

            if (!!prev.version) {
              prev.version.next = newNextId
            }

            if (!!next.version) {
              next.version.prev = newPrevId
            }
          }
        }
        const removeDeprecatedParc = filteredParcellations.filter(p => {
          if (!p.version) return true
          return !(p.version.deprecated)
        })

        return {
          templateSpaces,
          parcellations: removeDeprecatedParc
        }
      }),
      shareReplay(1)
    )
    this.httpCallCache.set(cacheKey, returnObs)
    return returnObs
  }

  constructor(
    private store: Store<any>,
    private http: HttpClient,
    private log: LoggingService,
    private snackbar: MatSnackBar,
    @Inject(BS_ENDPOINT) private bsEndpoint: string,
  ){
    this.darktheme$ = this.store.pipe(
      select(viewerStateSelectedTemplateSelector),
      map(tmpl => tmpl?.useTheme === 'dark')
    )

    this.useTouchUI$ = this.store.pipe(
      select(viewerConfigSelectorUseMobileUi),
      shareReplay(1)
    )

    this.subscriptions.push(
      this.fetchedAtlases$.subscribe(fetchedAtlases => 
        this.store.dispatch(
          viewerStateSetFetchedAtlases({ fetchedAtlases })
        )
      )
    )

    this.allFetchingReady$ = combineLatest([
      this.initFetchTemplate$.pipe(
        filter(v => !!v),
        map(arr => arr.length),
      ),
      this.store.pipe(
        select(viewerStateFetchedTemplatesSelector),
        map(arr => arr.length),
      ),
      this.store.pipe(
        select(viewerStateFetchedAtlasesSelector),
        map(arr => arr.length),
      )
    ]).pipe(
      map(([ expNumTmpl, actNumTmpl, actNumAtlas ]) => {
        return expNumTmpl === actNumTmpl && actNumAtlas === this.totalAtlasesLength
      }),
      distinctUntilChanged(),
      shareReplay(1),
    )
  }

  private getAtlases$ = this.http.get<TAtlas[]>(
    `${this.bsEndpoint}/atlases`,
    {
      observe: 'response'
    }
  ).pipe(
    tap(resp => {
      const respVersion = resp.headers.get(SIIBRA_API_VERSION_HEADER_KEY)
      if (respVersion !== SIIBRA_API_VERSION) {
        this.snackbar.open(`Expecting ${SIIBRA_API_VERSION}, got ${respVersion}. Some functionalities may not work as expected.`, 'Dismiss', {
          duration: 5000
        })
      }
      console.log(`siibra-api::version::${respVersion}, expecting::${SIIBRA_API_VERSION}`)
    }),
    map(resp => {
      const arr = resp.body
      const { EXPERIMENTAL_FEATURE_FLAG } = environment
      if (EXPERIMENTAL_FEATURE_FLAG) return arr
      return arr
      // return arr.filter(atlas => !/pre.?release/i.test(atlas.name))
    }),
    shareReplay(1),
  )

  public fetchedAtlases$: Observable<TIAVAtlas[]> = this.getAtlases$.pipe(
    switchMap(atlases => {
      return forkJoin(
        atlases.map(
          atlas => this.getSpacesAndParc(atlas.id).pipe(
            map(({ templateSpaces, parcellations }) => {
              return {
                '@id': atlas.id,
                name: atlas.name,
                templateSpaces: templateSpaces.map(tmpl => {
                  return {
                    '@id': tmpl.id,
                    name: tmpl.name,
                    availableIn: tmpl.availableParcellations.map(parc => {
                      return {
                        '@id': parc.id,
                        name: parc.name
                      }
                    }),
                    originDatainfos: (tmpl._dataset_specs || []).filter(spec => spec["@type"] === 'fzj/tmp/simpleOriginInfo/v0.0.1')
                  }
                }),
                parcellations: parcellations.filter(p => {
                  if (p.version?.deprecated) return false
                  return true
                }).map(parc => {
                  return {
                    '@id': parseId(parc.id),
                    name: parc.name,
                    baseLayer: parc.modality === 'cytoarchitecture',
                    '@version': {
                      '@next': parc.version?.next,
                      '@previous': parc.version?.prev,
                      'name': parc.version?.name,
                      '@this': parseId(parc.id)
                    },
                    groupName: parc.modality || null,
                    availableIn: parc.availableSpaces.map(space => {
                      return {
                        '@id': space.id,
                        name: space.name,
                        /**
                         * TODO need original data format
                         */
                        // originalDatasetFormats: [{
                        //   name: "probability map"
                        // }]
                      }
                    }),
                    originDatainfos: [...(parc.infos || []), ...(parc._dataset_specs || []).filter(spec => spec["@type"] === 'fzj/tmp/simpleOriginInfo/v0.0.1')]
                  }
                })
              }
            }),
            catchError((err, obs) => {
              console.error(err)
              return of(null)
            })
          )
        )
      )
    }),
    catchError((err, obs) => of([])),
    tap((arr: any[]) => this.totalAtlasesLength = arr.length),
    scan((acc, curr) => acc.concat(curr).sort((a, b) => (a.order || 0) - (b.order || 0)), []),
    shareReplay(1)
  )

  public initFetchTemplate$ = this.fetchedAtlases$.pipe(
    switchMap(atlases => {
      return forkJoin(
        atlases.map(atlas => this.getSpacesAndParc(atlas['@id']).pipe(
          switchMap(({ templateSpaces, parcellations }) => {
            const ngLayerObj = {}
            return forkJoin(
              templateSpaces.map(
                tmpl => {
                  // hardcode 
                  // see https://github.com/FZJ-INM1-BDA/siibra-python/issues/98
                  if (
                    tmpl.id === 'minds/core/referencespace/v1.0.0/tmp-fsaverage'
                    && !tmpl.availableParcellations.find(p => p.id === 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290')  
                  ) {
                    tmpl.availableParcellations.push({
                      id: 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290',
                      name: 'Julich-Brain Probabilistic Cytoarchitectonic Maps (v2.9)'
                    })
                  }
                  ngLayerObj[tmpl.id] = {}
                  return tmpl.availableParcellations.map(
                    parc => this.getRegions(atlas['@id'], parc.id, tmpl.id).pipe(
                      tap(regions => {
                        recursiveMutate(
                          regions,
                          region => region.children,
                          region => {
                            /**
                             * individual map(s)
                             * this should work for both fully mapped and interpolated
                             * in the case of interpolated, it sucks that the ngLayerObj will be set multiple times
                             */

                            const dedicatedMap = region._dataset_specs.filter(
                              spec => spec["@type"] === 'fzj/tmp/volume_type/v0.0.1'
                              && spec.space_id === tmpl.id
                              && spec['volume_type'] === 'neuroglancer/precomputed'
                            ) as TVolumeSrc<'neuroglancer/precomputed'>[]
                            if (dedicatedMap.length === 1) {
                              const ngId = getNgId(atlas['@id'], tmpl.id, parc.id, dedicatedMap[0]['@id'])
                              region['ngId'] = ngId
                              region['labelIndex'] = dedicatedMap[0].detail['neuroglancer/precomputed'].labelIndex
                              ngLayerObj[tmpl.id][ngId] = {
                                source: `precomputed://${dedicatedMap[0].url}`,
                                type: "segmentation",
                                transform: dedicatedMap[0].detail['neuroglancer/precomputed'].transform
                              }
                            }
  
                            /**
                             * if label index is defined
                             */
                            if (!!region.labelIndex) {
                              const hemisphereKey = /left hemisphere|left/.test(region.name)
                                // these two keys are, unfortunately, more or less hardcoded
                                // which is less than ideal
                                ? 'left hemisphere'
                                : /right hemisphere|right/.test(region.name)
                                  ? 'right hemisphere'
                                  : 'whole brain'

                              if (!region['ngId']) {
                                const hemispheredNgId = getNgId(atlas['@id'], tmpl.id, parc.id, hemisphereKey)
                                region['ngId'] = hemispheredNgId
                              }
                            }
                          }  
                        )
                        this.atlasParcSpcRegionMap.set(
                          atlas['@id'], tmpl.id, parc.id, regions
                        )
  
                        /**
                         * populate maps for parc
                         */
                        for (const parc of parcellations) {
                          const precomputedVols = parc._dataset_specs.filter(
                            spec => spec["@type"] === 'fzj/tmp/volume_type/v0.0.1'
                              && spec.volume_type === 'neuroglancer/precomputed'
                              && spec.space_id === tmpl.id
                          ) as TVolumeSrc<'neuroglancer/precomputed'>[]

                          if (precomputedVols.length === 1) {
                            const vol = precomputedVols[0]
                            const key = 'whole brain'

                            const ngIdKey = getNgId(atlas['@id'], tmpl.id, parseId(parc.id), key)
                            ngLayerObj[tmpl.id][ngIdKey] = {
                              source: `precomputed://${vol.url}`,
                              type: "segmentation",
                              transform: vol.detail['neuroglancer/precomputed'].transform
                            }
                          }

                          if (precomputedVols.length === 2) {
                            const mapIndexKey = [{
                              mapIndex: 0,
                              key: 'left hemisphere'
                            }, {
                              mapIndex: 1,
                              key: 'right hemisphere'
                            }]
                            for (const { key, mapIndex } of mapIndexKey) {
                              const ngIdKey = getNgId(atlas['@id'], tmpl.id, parseId(parc.id), key)
                              ngLayerObj[tmpl.id][ngIdKey] = {
                                source: `precomputed://${precomputedVols[mapIndex].url}`,
                                type: "segmentation",
                                transform: precomputedVols[mapIndex].detail['neuroglancer/precomputed'].transform
                              }
                            }
                          }

                          if (precomputedVols.length > 2) {
                            console.error(`precomputedVols.length > 0, most likely an error`)
                          }
                        }
                      }),
                      catchError((err, obs) => {
                        return of(null)
                      })
                    )
                  )
                }
              ).reduce(flattenReducer, [])
            ).pipe(
              mapTo({ templateSpaces, parcellations, ngLayerObj })
            )
          }),
          map(({ templateSpaces, parcellations, ngLayerObj }) => {
            return templateSpaces.map(tmpl => {

              // configuring three-surfer
              let threeSurferConfig = {}
              const volumes  = tmpl._dataset_specs.filter(v => v["@type"] === 'fzj/tmp/volume_type/v0.0.1') as TVolumeSrc<keyof IVolumeTypeDetail>[]
              const threeSurferVolSrc = volumes.find(v => v.volume_type === 'threesurfer/gii')
              if (threeSurferVolSrc) {
                const foundP = parcellations.find(p => {
                  return p._dataset_specs.some(spec => spec["@type"] === 'fzj/tmp/volume_type/v0.0.1' && spec.space_id === tmpl.id)
                })
                const url = threeSurferVolSrc.url
                const { surfaces } = threeSurferVolSrc.detail['threesurfer/gii'] as { surfaces: {mode: string, hemisphere: 'left' | 'right', url: string}[] }
                const modObj = {}
                for (const surface of surfaces) {
                  
                  const hemisphereKey = surface.hemisphere === 'left'
                    ? 'left hemisphere'
                    : 'right hemisphere'


                  /**
                   * concating all available gii maps
                   */
                  // const allFreesurferLabels = foundP.volumeSrc[tmpl.id][hemisphereKey].filter(v => v.volume_type === 'threesurfer/gii-label')
                  // for (const lbl of allFreesurferLabels) {
                  //   const modeToConcat = {
                  //     mesh: surface.url,
                  //     hemisphere: surface.hemisphere,
                  //     colormap: lbl.url
                  //   }

                  //   const key = `${surface.mode} - ${lbl.name}`
                  //   if (!modObj[key]) {
                  //     modObj[key] = []
                  //   }
                  //   modObj[key].push(modeToConcat)
                  // }

                  /**
                   * only concat first matching gii map
                   */
                  const mapIndex = hemisphereKey === 'left hemisphere'
                    ? 0
                    : 1
                  const labelMaps = foundP._dataset_specs.filter(spec => spec["@type"] === 'fzj/tmp/volume_type/v0.0.1' && spec.volume_type === 'threesurfer/gii-label') as TVolumeSrc<'threesurfer/gii-label'>[]
                  const key = surface.mode
                  const modeToConcat = {
                    mesh: surface.url,
                    hemisphere: surface.hemisphere,
                    colormap: (() => {
                      const lbl = labelMaps[mapIndex]
                      return lbl?.url
                    })()
                  }
                  if (!modObj[key]) {
                    modObj[key] = []
                  }
                  modObj[key].push(modeToConcat)

                }
                foundP[tmpl.id]
                threeSurferConfig = {
                  "three-surfer": {
                    '@context': {
                      root: url
                    },
                    modes: Object.keys(modObj).map(name => {
                      return {
                        name,
                        meshes: modObj[name]
                      }
                    })
                  },
                  nehubaConfig: null,
                  nehubaConfigURL: null,
                  useTheme: 'dark'
                }
              }
              const darkTheme = tmpl.src_volume_type === 'mri'
              const nehubaConfig = getNehubaConfig(tmpl)
              const initialLayers = nehubaConfig.dataset.initialNgState.layers
              
              const tmplAuxMesh = `${tmpl.name} auxmesh`

              const precomputedArr = tmpl._dataset_specs.filter(src => src['@type'] === 'fzj/tmp/volume_type/v0.0.1' && src.volume_type === 'neuroglancer/precomputed') as TVolumeSrc<'neuroglancer/precomputed'>[]
              let visible = true
              let tmplNgId: string
              const templateImages: TTemplateImage[] = []
              for (const precomputedItem of precomputedArr) {
                const ngIdKey = MultiDimMap.GetKey(precomputedItem["@id"])
                const precomputedUrl = 'https://neuroglancer.humanbrainproject.eu/precomputed/data-repo-ng-bot/20211001-mebrain/precomputed/images/MEBRAINS_T1.masked' === precomputedItem.url
                  ? 'https://neuroglancer.humanbrainproject.eu/precomputed/data-repo-ng-bot/20211018-mebrains-masked-templates/precomputed/images/MEBRAINS_T1_masked'
                  : precomputedItem.url
                initialLayers[ngIdKey] = {
                  type: "image",
                  source: `precomputed://${precomputedUrl}`,
                  transform: precomputedItem.detail['neuroglancer/precomputed'].transform,
                  visible
                }
                templateImages.push({
                  "@id": precomputedItem['@id'],
                  name: precomputedItem.name,
                  ngId: ngIdKey,
                  visible
                })
                if (visible) {
                  tmplNgId = ngIdKey
                }
                visible = false
              }

              // TODO
              // siibra-python accidentally left out volume type of precompmesh
              // https://github.com/FZJ-INM1-BDA/siibra-python/pull/55
              // use url to determine for now
              // const precompmesh = tmpl.volume_src.find(src => src.volume_type === 'neuroglancer/precompmesh')
              const precompmesh = tmpl._dataset_specs.find(src => src["@type"] === 'fzj/tmp/volume_type/v0.0.1' && !!src.detail?.['neuroglancer/precompmesh']) as TVolumeSrc<'neuroglancer/precompmesh'>
              const auxMeshes = []
              if (precompmesh){
                initialLayers[tmplAuxMesh] = {
                  source: `precompmesh://${precompmesh.url}`,
                  type: "segmentation",
                  transform: precompmesh.detail['neuroglancer/precompmesh'].transform
                }
                for (const auxMesh of precompmesh.detail['neuroglancer/precompmesh'].auxMeshes) {

                  auxMeshes.push({
                    ...auxMesh,
                    ngId: tmplAuxMesh,
                    '@id': `${tmplAuxMesh} ${auxMesh.name}`,
                    visible: true
                  })
                }
              }

              for (const key in (ngLayerObj[tmpl.id] || {})) {
                initialLayers[key] = ngLayerObj[tmpl.id][key]
              }

              return {
                name: tmpl.name,
                '@id': tmpl.id,
                fullId: tmpl.id,
                useTheme: darkTheme ? 'dark' : 'light',
                ngId: tmplNgId,
                nehubaConfig,
                templateImages,
                auxMeshes,
                /**
                 * only populate the parcelltions made available
                 */
                parcellations: tmpl.availableParcellations.filter(
                  p => parcellations.some(p2 => parseId(p2.id) === p.id)
                ).map(parc => {
                  const fullParcInfo = parcellations.find(p => parseId(p.id) === parc.id)
                  const regions = this.atlasParcSpcRegionMap.get(atlas['@id'], tmpl.id, parc.id) || []
                  return {
                    fullId: parc.id,
                    '@id': parc.id,
                    name: parc.name,
                    regions,
                    originDatainfos: [...fullParcInfo.infos, ...(fullParcInfo?._dataset_specs || []).filter(spec => spec["@type"] === 'fzj/tmp/simpleOriginInfo/v0.0.1')]
                  }
                }),
                ...threeSurferConfig
              }
            })
          })
        ))
      )
    }),
    map(arr => {
      return arr.reduce(flattenReducer, [])
    }),
    catchError((err) => {
      this.log.warn(`fetching templates error`, err)
      return of(null)
    }),
    shareReplay(1),
  )

  ngOnDestroy(){
    while(this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }
}
