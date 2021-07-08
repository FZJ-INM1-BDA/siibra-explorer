import { Inject, Injectable, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, Subscription, of, forkJoin, fromEvent, combineLatest } from "rxjs";
import { viewerConfigSelectorUseMobileUi } from "src/services/state/viewerConfig.store.helper";
import { shareReplay, tap, scan, catchError, filter, switchMap, map, take, distinctUntilChanged, mapTo } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { viewerStateFetchedTemplatesSelector, viewerStateSetFetchedAtlases } from "src/services/state/viewerState.store.helper";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { LoggingService } from "src/logging";
import { viewerStateFetchedAtlasesSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { BS_ENDPOINT } from "src/util/constants";
import { flattenReducer } from 'common/util'
import { TAtlas, TId, TParc, TRegion, TRegionDetail, TSpaceFull, TSpaceSummary } from "./siibraApiConstants/types";
import { MultiDimMap, recursiveMutate } from "./fn";

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

const spaceMiscInfoMap = new Map([
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
          "flipRemovedOctant": true
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

  private _backendUrl = (BACKEND_URL && `${BACKEND_URL}/`.replace(/\/\/$/, '/')) || `${window.location.origin}${window.location.pathname}`
  get backendUrl() {
    console.warn(`something is using backendUrl`)
    return this._backendUrl
  }

  /**
   * TODO remove
   * when removing, also remove relevant worker code
   */
  private workerUpdateParcellation$ = fromEvent(this.workerService.worker, 'message').pipe(
    filter((message: MessageEvent) => message && message.data && message.data.type === 'UPDATE_PARCELLATION_REGIONS'),
    map(({ data }) => data)
  )

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

  private getRegions(atlasId: string, parcId: string, spaceId: string){
    return this.http.get<TRegion[]>(
      `${this.bsEndpoint}/atlases/${encodeURIComponent(atlasId)}/parcellations/${encodeURIComponent(parcId)}/regions`,
      {
        params: {
          'space_id': spaceId
        },
        responseType: 'json'
      }
    )
  }

  private getParcs(atlasId: string){
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

  private getSpaces(atlasId: string){
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
          for (const spaceKey in p.volumeSrc) {
            for (const hemisphereKey in p.volumeSrc[spaceKey]) {
              if (p.volumeSrc[spaceKey][hemisphereKey].some(vol => vol.volume_type === 'neuroglancer/precomputed')) return true
              if (p.volumeSrc[spaceKey][hemisphereKey].some(vol => vol.volume_type === 'neuroglancer/precompmesh')) return true
              if (p.volumeSrc[spaceKey][hemisphereKey].some(vol => vol.volume_type === 'threesurfer/gii')) return true
              if (p.volumeSrc[spaceKey][hemisphereKey].some(vol => vol.volume_type === 'threesurfer/gii-label')) return true
            }
          }
          return false
        })
        return {
          templateSpaces,
          parcellations: filteredParcellations
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
    private workerService: AtlasWorkerService,
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
      responseType: 'json'
    }
  ).pipe(
    shareReplay(1)
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
                    originDatainfos: tmpl.originDatainfos || []
                  }
                }),
                parcellations: parcellations.map(parc => {
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
                    originDatainfos: parc.originDatainfos || []
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
    scan((acc, curr) => acc.concat(curr).sort((a, b) => (a.order || 1001) - (b.order || 1000)), []),
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
                            if (
                              tmpl.id in (region.volumeSrc || {})
                              && 'collect' in region.volumeSrc[tmpl.id]
                            ) {
                              const dedicatedMap = region.volumeSrc[tmpl.id]['collect'].filter(v => v.volume_type === 'neuroglancer/precomputed')
                              if (dedicatedMap.length === 1) {
                                const ngId = '_' + MultiDimMap.GetKey(atlas['@id'], tmpl.id, parc.id, dedicatedMap[0]['@id'])
                                region['ngId'] = ngId
                                region['labelIndex'] = dedicatedMap[0].detail['neuroglancer/precomputed'].labelIndex
                                ngLayerObj[tmpl.id][ngId] = {
                                  source: `precomputed://${dedicatedMap[0].url}`,
                                  type: "segmentation",
                                  transform: dedicatedMap[0].detail['neuroglancer/precomputed'].transform
                                }
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

                              /**
                               * TODO fix in siibra-api
                               */
                              if (
                                tmpl.id !== 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588'
                                && parc.id === 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290'
                                && hemisphereKey === 'whole brain'
                              ) {
                                region.labelIndex = null
                                return
                              }

                              const hemispheredNgId = '_' + MultiDimMap.GetKey(atlas['@id'], tmpl.id, parc.id, hemisphereKey)
                              region['ngId'] = hemispheredNgId
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
                          if (tmpl.id in (parc.volumeSrc || {})) {
                            // key: 'left hemisphere' | 'right hemisphere' | 'whole brain'
                            for (const key in (parc.volumeSrc[tmpl.id] || {})) {
                              for (const vol of parc.volumeSrc[tmpl.id][key]) {
                                if (vol.volume_type === 'neuroglancer/precomputed') {
                                  const ngIdKey = '_' + MultiDimMap.GetKey(atlas['@id'], tmpl.id, parseId(parc.id), key)
                                  ngLayerObj[tmpl.id][ngIdKey] = {
                                    source: `precomputed://${vol.url}`,
                                    type: "segmentation",
                                    transform: vol.detail['neuroglancer/precomputed'].transform
                                  }
                                }
                              }
                            }
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
              const threeSurferVolSrc = tmpl.volume_src.find(v => v.volume_type === 'threesurfer/gii')
              if (threeSurferVolSrc) {
                const foundP = parcellations.find(p => {
                  return !!p.volumeSrc[tmpl.id]
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
                  const key = surface.mode
                  const modeToConcat = {
                    mesh: surface.url,
                    hemisphere: surface.hemisphere,
                    colormap: (() => {
                      const lbl = foundP.volumeSrc[tmpl.id][hemisphereKey].find(v => v.volume_type === 'threesurfer/gii-label')
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
              
              const tmplNgId = tmpl.name
              const tmplAuxMesh = `${tmpl.name} auxmesh`

              const precomputed = tmpl.volume_src.find(src => src.volume_type === 'neuroglancer/precomputed')
              if (precomputed) {
                initialLayers[tmplNgId] = {
                  type: "image",
                  source: `precomputed://${precomputed.url}`,
                  transform: precomputed.detail['neuroglancer/precomputed'].transform
                }
              }

              // TODO
              // siibra-python accidentally left out volume type of precompmesh
              // https://github.com/FZJ-INM1-BDA/siibra-python/pull/55
              // use url to determine for now
              // const precompmesh = tmpl.volume_src.find(src => src.volume_type === 'neuroglancer/precompmesh')
              const precompmesh = tmpl.volume_src.find(src => !!src.detail?.['neuroglancer/precompmesh'])
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
                    originDatainfos: fullParcInfo?.originDatainfos || []
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
