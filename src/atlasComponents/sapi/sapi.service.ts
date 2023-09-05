import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { catchError, map, shareReplay, switchMap, take, tap } from "rxjs/operators";
import { getExportNehuba, noop } from "src/util/fn";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { EnumColorMapName } from "src/util/colorMaps";
import { forkJoin, from, NEVER, Observable, of, throwError } from "rxjs";
import { environment } from "src/environments/environment"
import {
  translateV3Entities
} from "./translateV3"
import { FeatureType, PathReturn, RouteParam, SapiRoute } from "./typeV3";
import { BoundingBox, SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate, VoiFeature, Feature } from "./sxplrTypes";
import { parcBanList, speciesOrder } from "src/util/constants";

export const useViewer = {
  THREESURFER: "THREESURFER",
  NEHUBA: "NEHUBA",
  NOT_SUPPORTED: "NOT_SUPPORTED" 
} as const

export const SIIBRA_API_VERSION_HEADER_KEY='x-siibra-api-version'
export const EXPECTED_SIIBRA_API_VERSION = '0.3.8'

let BS_ENDPOINT_CACHED_VALUE: Observable<string> = null

type PaginatedResponse<T> = {
  items: T[]
  total: number
  page?: number
  size?: number
  pages?: number
}


@Injectable({
  providedIn: 'root'
})
export class SAPI{

  static API_VERSION = null

  /**
   * Used to clear BsEndPoint, so the next static get BsEndpoints$ will
   * fetch again. Only used for unit test of BsEndpoint$
   */
  static ClearBsEndPoint(){
    BS_ENDPOINT_CACHED_VALUE = null
  }

  iteratePages<T>(resp: PaginatedResponse<T>, cb: (page: number) => Observable<PaginatedResponse<T>>) {
    /**
     * technically, it's easier to use a concat + merge + reduce map rather than forkJoin + flatmap
     * but merge does not guarantee same order, forkjoin does
     * I don't know if page order matters, but it's good to be safe
     */
    const pages = Math.ceil(resp.total / resp.size)
    return forkJoin([
      of(resp.items),
      
      /**
       * similar to python's range function, this function generates a uniformly increasing array, to pages
       * discarding first, since we already got it
       */
      ...Array(pages).fill(null).map((_, idx) => idx + 1).slice(1)
        .map(page => 
          cb(page).pipe(
            map(v => v.items)
          )
        )
    ]).pipe(
      map(arrOfArr => arrOfArr.flatMap(v => v))
    )
  }

  static async VerifyEndpoint(url: string): Promise<string> {
    const resp = await fetch(`${url}/atlases`)
    await resp.json()
    if (resp.status >= 400) {
      return Promise.reject(resp.statusText)
    }
    
    if (!SAPI.API_VERSION) {
      SAPI.API_VERSION = resp.headers.get(SIIBRA_API_VERSION_HEADER_KEY)
      console.log(`siibra-api::version::${SAPI.API_VERSION}, expecting::${EXPECTED_SIIBRA_API_VERSION}`)
    }
    return url
  }

  /**
   * BsEndpoint$ is designed as a static getter mainly for unit testing purposes.
   * see usage of BsEndpoint$ and ClearBsEndPoint in sapi.service.spec.ts
   */
  static get BsEndpoint$(): Observable<string> {
    if (!!BS_ENDPOINT_CACHED_VALUE) return BS_ENDPOINT_CACHED_VALUE
    const endpoints = environment.SIIBRA_API_ENDPOINTS.split(',')
    if (endpoints.length === 0) {
      SAPI.ErrorMessage = `No siibra-api endpoint defined!`
      return NEVER
    }
    const mainEndpoint = endpoints[0]
    const backupEndpoints = endpoints.slice(1)
    
    BS_ENDPOINT_CACHED_VALUE = new Observable<string>(obs => {
      (async () => {
        const backupPr = new Promise<string>(rs => {
          for (const endpt of backupEndpoints) {
            SAPI.VerifyEndpoint(endpt)
              .then(flag => {
                if (flag) rs(endpt)
              })
              .catch(noop)
          }
        })
        try {
          const url = await Promise.race([
            SAPI.VerifyEndpoint(mainEndpoint),
            new Promise<string>((_, rj) => setTimeout(() => rj(`10s timeout`), 10000))
          ])
          obs.next(url)
        } catch (e) {

          try {
            const url = await Promise.race([
              backupPr,
              new Promise<string>((_, rj) => setTimeout(() => rj(`5s timeout`), 5000))
            ])
            obs.next(url)
          } catch (e) {
            SAPI.ErrorMessage = `No usabe mirror found`
          }
        } finally {
          obs.complete()
        }
      })()
    }).pipe(
      take(1),
      shareReplay(1),
    )
    return BS_ENDPOINT_CACHED_VALUE
  }

  static ErrorMessage = null

  getParcRegions(parcId: string) {
    const param = {
      query: {
        parcellation_id: parcId,
      },
    }
    return this.v3Get("/regions", param).pipe(
      switchMap(resp =>
        this.iteratePages(
          resp,
          (page) => this.v3Get("/regions", {
            ...param,
            query: {
              ...param.query,
              page
            },
          })
        ).pipe(
          switchMap(regions => forkJoin(regions.map(r => translateV3Entities.translateRegion(r)))),
        )
      ),
    )
  }

  getMap(parcId: string, spaceId: string, mapType: "LABELLED" | "STATISTICAL") {
    return this.v3Get("/map", {
      query: {
        map_type: mapType,
        parcellation_id: parcId,
        space_id: spaceId
      }
    })
  }

  #isPaged<T>(resp: any): resp is PaginatedResponse<T>{
    if (!!resp.total || resp.total === 0) return true
    return false
  }
  getV3Features<T extends FeatureType>(featureType: T, sapiParam: RouteParam<`/feature/${T}`>): Observable<Feature[]> {
    const query = structuredClone(sapiParam)
    return this.v3Get<`/feature/${T}`>(`/feature/${featureType}`, {
      ...query
    }).pipe(
      switchMap(resp => {
        if (!this.#isPaged(resp)) return throwError(`endpoint not returning paginated response`)
        return this.iteratePages(
          resp,
          page => {
            const query = structuredClone(sapiParam)
            query.query.page = page
            return this.v3Get(`/feature/${featureType}`, {
              ...query,
            }).pipe(
              map(val => {
                if (this.#isPaged(val)) return val
                return { items: [], total: 0, page: 0, size: 0 }
              })
            )
          }
        )
      }),
      switchMap(features => features.length === 0
        ? of([])
        : forkJoin(
          features.map(feat => translateV3Entities.translateFeature(feat) )
        )
      ),
      catchError((err) => {
        console.error("Error fetching features", err)
        return of([])}),
    )
  }

  getV3FeatureDetail<T extends FeatureType>(featureType: T, sapiParam: RouteParam<`/feature/${T}/{feature_id}`>): Observable<PathReturn<`/feature/${T}/{feature_id}`>> {
    return this.v3Get<`/feature/${T}/{feature_id}`>(`/feature/${featureType}/{feature_id}`, {
      ...sapiParam
    })
  }

  getFeaturePlot(id: string, params: RouteParam<"/feature/{feature_id}/plotly">["query"] = {}) {
    return this.v3Get("/feature/{feature_id}/plotly", {
      path: {
        feature_id: id
      },
      query: params
    })
  }

  getV3FeatureDetailWithId(id: string, params: Record<string,  string> = {}) {
    return this.v3Get("/feature/{feature_id}", {
      path: {
        feature_id: id
      },
      query_param: params
    } as any).pipe(
      switchMap(val => translateV3Entities.translateFeature(val))
    )
  }

  getModalities() {
    return this.v3Get("/feature/_types", { query: {} }).pipe(
      map(v => v.items)
    )
  }

  v3GetRoute<T extends SapiRoute>(route: T, sapiParam: RouteParam<T>) {
    const params: Record<string, string|number> = "query" in sapiParam ? sapiParam["query"] : {}
    const _path: Record<string, string|number> = "path" in sapiParam ? sapiParam["path"] : {}
    let path: string = route
    for (const key in _path) {
      path = path.replace(`{${key}}`, _path[key].toString())
    }
    return { path, params }
  }

  /**
   * Should be privated. All components use this method forms a tight coupling to API
   * Use this method sparingly!
   * @param route 
   * @param sapiParam 
   * @returns 
   */
  v3Get<T extends SapiRoute>(route: T, sapiParam: RouteParam<T>){
    return SAPI.BsEndpoint$.pipe(
      switchMap(endpoint => {
        const headers: Record<string, string> = {}
        const { path, params } = this.v3GetRoute(route, sapiParam)
        return this.http.get<PathReturn<T>>(
          `${endpoint}${path}`,
          {
            headers,
            params
          }
        )
      })
    )
  }

  /**
   * @deprecated
   * @param url 
   * @param params 
   * @param sapiParam 
   * @returns 
   */
  httpGet<T>(url: string, params?: Record<string, string>){
    const headers: Record<string, string> = {}
    return this.http.get<T>(
      url,
      {
        headers,
        params
      }
    )
  }

  public atlases$ = this.v3Get("/atlases", {
    query: {}
  }).pipe(
    switchMap(atlases => forkJoin(
      atlases.items.map(atlas => translateV3Entities.translateAtlas(atlas))
    )),
    map(atlases => atlases.sort((a, b) => (speciesOrder as string[]).indexOf(a.species) - (speciesOrder as string[]).indexOf(b.species))),
    tap(() => {
      const respVersion = SAPI.API_VERSION
      if (respVersion !== EXPECTED_SIIBRA_API_VERSION) {
        this.snackbar.open(`Expecting ${EXPECTED_SIIBRA_API_VERSION}, got ${respVersion}. Some functionalities may not work as expected.`, 'Dismiss', {
          duration: 5000
        })
      }
    }),
    shareReplay(1),
  )

  public getAllSpaces(atlas: SxplrAtlas): Observable<SxplrTemplate[]> {
    return forkJoin(
      translateV3Entities.retrieveAtlas(atlas).spaces.map(
        spc => this.v3Get("/spaces/{space_id}", { path: { space_id: spc["@id"] } }).pipe(
          switchMap(v => translateV3Entities.translateTemplate(v))
        )
      )
    )
  }

  public getAllParcellations(atlas: SxplrAtlas): Observable<SxplrParcellation[]> {
    return forkJoin(
      translateV3Entities.retrieveAtlas(atlas).parcellations.filter(
        p => {
          const { ['@id']: id } = p
          return !parcBanList.includes(id)
        }
      ).map(
        parc => this.v3Get("/parcellations/{parcellation_id}", { path: { parcellation_id: parc["@id"] } }).pipe(
          switchMap(v => translateV3Entities.translateParcellation(v))
        )
      )
    )
  }

  #tmplToParcMap = new Map<string, SxplrParcellation[]>()
  public getSupportedParcellations(atlas: SxplrAtlas, template: SxplrTemplate): Observable<SxplrParcellation[]> {
    if (!template) {
      return throwError(`template cannot be empty!`)
    }
    if (this.#tmplToParcMap.has(template.id)) {
      return of(this.#tmplToParcMap.get(template.id))
    }
    return this.getAllParcellations(atlas).pipe(
      switchMap(parcs => forkJoin(
        parcs.map(
          parc => this.getMap(
            parc.id,
            template.id,
            "LABELLED"
          ).pipe(
            catchError(() => of(null as SxplrParcellation)),
            map(_map => _map && parc)
          )
        )
      ).pipe(
        map(arr => {
          const val = arr.filter(v => !!v)
          this.#tmplToParcMap.set(template.id, val)
          return val
        })
      ))
    )
  }

  public getStatisticalMap(parcellation: SxplrParcellation, template: SxplrTemplate, region: SxplrRegion) {
    const query = {
      parcellation_id: parcellation.id,
      region_id: region.name,
      space_id: template.id
    }
    return SAPI.BsEndpoint$.pipe(
      switchMap(endpoint => {
        const _url = this.v3GetRoute("/map/statistical_map.nii.gz", {
          query
        })
        const url = new URL(`${endpoint}${_url.path}`)
        for (const key in _url.params) {
          url.searchParams.set(key, _url.params[key].toString())
        }
        
        return from((async () => {
          const resp = await fetch(url)
          const arraybuffer = await resp.arrayBuffer()
          let outbuf: ArrayBuffer
          try {
            outbuf = (await getExportNehuba()).pako.inflate(arraybuffer).buffer
          } catch (e) {
            console.log("unpack error", e)
            outbuf = arraybuffer
          }
      
          const { result } = await this.workerSvc.sendMessage({
            method: "PROCESS_NIFTI",
            param: {
              nifti: outbuf,
            },
            transfers: [outbuf],
          })

          const { meta, buffer } = result
          return { meta, buffer } as {
            meta: {
              min: number
              max: number
            }
            buffer: ArrayBuffer
          }
        })())
      })
    )
  }

  #parcIdToTmplMap = new Map<string, SxplrTemplate[]>()
  public getSupportedTemplates(atlas: SxplrAtlas, parc: SxplrParcellation): Observable<SxplrTemplate[]> {
    if (!parc) {
      return throwError(`parc cannot be empty!`)
    }
    if (this.#parcIdToTmplMap.has(parc.id)) {
      return of(this.#parcIdToTmplMap.get(parc.id))
    }
    return this.getAllSpaces(atlas).pipe(
      switchMap(spaces => forkJoin(
        spaces.map(
          space => this.getMap(
            parc.id,
            space.id,
            "LABELLED"
          ).pipe(
            catchError(() => of(null as SxplrTemplate)),
            map(_map => _map && space)
          )
        )
      ).pipe(
        map(arr => {
          const val = arr.filter(v => !!v)
          this.#parcIdToTmplMap.set(parc.id, val)
          return val
        })
      ))
    )
  }

  public getVoiFeatures(bbox: BoundingBox): Observable<VoiFeature[]> {
    /**
     * FIXME iterate over all pages
     */
    return this.v3Get("/feature/Image", {
      query: {
        space_id: bbox.space.id,
        bbox: JSON.stringify([bbox.minpoint, bbox.maxpoint]),
      }
    }).pipe(
      switchMap(v => Promise.all(v.items.map(item => translateV3Entities.translateVoiFeature(item))))
    )
  }

  private async getLabelledMap(parcellation: SxplrParcellation, template: SxplrTemplate) {
    // No need to retrieve sapi object, since we know @id maps to id
    return await this.v3Get("/map", {
      query: {
        map_type: "LABELLED",
        parcellation_id: parcellation.id,
        space_id: template.id
      }
    }).toPromise()
  }

  public useViewer(template: SxplrTemplate) {
    if (!template) {
      return of(null as keyof typeof useViewer)
    }
    return forkJoin({
      voxel: this.getVoxelTemplateImage(template),
      surface: this.getSurfaceTemplateImage(template)
    }).pipe(
      map(vols => {
        if (!vols) return null
        const { voxel, surface } = vols
        if (voxel.length > 0 && surface.length > 0) {
          console.error(`both voxel and surface length are > 0, this should not happen.`)
          return useViewer.NOT_SUPPORTED
        }
        if (voxel.length > 0) {
          return useViewer.NEHUBA
        }
        if (surface.length > 0) {
          return useViewer.THREESURFER
        }
        return useViewer.NOT_SUPPORTED
      })
    )
  }

  public getVoxelTemplateImage(template: SxplrTemplate) {
    return from(translateV3Entities.translateSpaceToVolumeImage(template))
  }

  public getVoxelAuxMesh(template: SxplrTemplate) {
    return from(translateV3Entities.translateSpaceToAuxMesh(template))
  }

  public getSurfaceTemplateImage(template: SxplrTemplate) {
    return from(translateV3Entities.translateSpaceToSurfaceImage(template))
  }
  /**
   * Even though this creates a rather tight coupling between sapi.server and nehuba viewer module
   * This is better than the alternative, which is creating a tight coupling between nehuba viewer module and siibra-api
   */

  public async getTranslatedLabelledNgMap(parcellation: SxplrParcellation, template: SxplrTemplate) {
    if (!parcellation || !template) return {}
    const map = await this.getLabelledMap(parcellation, template)

    for (const regionname in map.indices) {
      // if (parcellation.id === IDS.PARCELLATION.CORTICAL_LAYERS) {
      //   if (regionname.includes("left") || regionname.includes("right")) {
      //     continue
      //   }
      // }
      for (const { volume: volumeIdx, fragment } of map.indices[regionname]) {
        const { providedVolumes } = map.volumes[volumeIdx]
        if (!("neuroglancer/precomputed" in providedVolumes)) {
          continue
        }
        const provider = providedVolumes["neuroglancer/precomputed"]
          
        const src = fragment
          ? provider[fragment]
          : provider

        const match = /https?:\/\/.*?\/(.*?)$/.exec(src)
        const regionFragment = match
          ? match[1]
          : src
        translateV3Entities.mapTPRToFrag[template.id][parcellation.id][regionname] = regionFragment
      }
    }
    
    return await translateV3Entities.translateLabelledMapToNgSegLayers(map)
  }

  public async getTranslatedLabelledThreeMap(parcellation: SxplrParcellation, template: SxplrTemplate){
    if (!parcellation || !template) return {}
    const map = await this.getLabelledMap(parcellation, template)
    return await translateV3Entities.translateLabelledMapToThreeLabel(map)
  }
  
  #tmplParcMap = new Map<string, PathReturn<"/map">>()
  public async getRegionLabelIndices(tmpl: SxplrTemplate, parc: SxplrParcellation, region: SxplrRegion) {
    const key = `${tmpl.id}::${parc.id}`

    if (!this.#tmplParcMap.has(key)) {
      const _map = await this.v3Get("/map", {
        query: {
          map_type: "LABELLED",
          parcellation_id: parc.id,
          space_id: tmpl.id
        }
      }).toPromise()
      this.#tmplParcMap.set(key, _map)
    }

    const { indices } = this.#tmplParcMap.get(key)
    const index = indices[region.name] || []
    if (index.length === 0) {
      throw new Error(`No map index found for ${region.name}`)
    }
    if (index.length !== 1) {
      console.warn(`Multiple map indicies found... Using the first one`)
    }
    const _index = index[0]
    return _index.label
  }

  constructor(
    public http: HttpClient,
    private snackbar: MatSnackBar,
    private workerSvc: AtlasWorkerService,
  ){
    if (SAPI.ErrorMessage) {
      this.snackbar.open(SAPI.ErrorMessage, 'Dismiss', { duration: 5000 })
    }
  }
  
  /**
   * 
   * @deprecated
   * @param input 
   * @param method 
   * @param params 
   * @returns 
   */
  async processNpArrayData<T extends keyof ProcessTypedArrayResult>(input: any /*SpyNpArrayDataModel*/, method: PARSE_TYPEDARRAY = PARSE_TYPEDARRAY.RAW_ARRAY, params: ProcessTypedArrayResult[T]['input'] = null): Promise<ProcessTypedArrayResult[T]['output']> {
    return null
    const supportedDtype = [
      "uint8",
      "int32",
      "float32"
    ]
    const {
      "x-channel": channel,
      "x-width": width,
      "x-height": height,
      content,
      dtype,
      content_encoding: contentEncoding, 
      content_type: contentType
    } = input
    
    if (contentType !== "application/octet-stream") {
      throw new Error(`sapi.service#decodeNpArrayDataModel error: expecting content_type to be "application/octet-stream", but is ${contentType}`)
    }
    if (contentEncoding !== "gzip; base64") {
      throw new Error(`sapi.service#decodeNpArrayDataModel error: expecting content_encoding to be "gzip; base64", but is ${contentEncoding}`)
    }
    if (supportedDtype.indexOf(dtype) < 0) {
      throw new Error(`sapi.service#decodeNpArrayDataModel error: expecting dtype to be in ${JSON.stringify(supportedDtype)}, but is ${dtype}`)
    }

    try {
      const bin = atob(content)
      const { pako } = await getExportNehuba()
      const array = pako.inflate(bin)
      let workerMsg: string
      switch (method) {
      case PARSE_TYPEDARRAY.CANVAS_FORTRAN_RGBA: {
        workerMsg = "PROCESS_TYPED_ARRAY_F2RGBA"
        break
      }
      case PARSE_TYPEDARRAY.CANVAS_COLORMAP_RGBA: {
        workerMsg = "PROCESS_TYPED_ARRAY_CM2RGBA"
        break
      }
      case PARSE_TYPEDARRAY.RAW_ARRAY: {
        workerMsg = "PROCESS_TYPED_ARRAY_RAW"
        break
      }
      default:{
        throw new Error(`sapi.service#decodeNpArrayDataModel: method cannot be deciphered: ${method}`)
      }
      }
      const { result } = await this.workerSvc.sendMessage({
        method: workerMsg,
        param: {
          inputArray: array,
          width,
          height,
          channel,
          dtype,
          processParams: params
        },
        transfers: [ array.buffer ]
      })
      const { buffer, outputArray, min, max } = result
      return {
        type: method,
        result: buffer,
        rawArray: outputArray,
        min,
        max
      }
    } catch (e) {
      throw new Error(`sapi.service#decodeNpArrayDataModel error: ${e}`)
    }
  }
}

/**
 * @deprecated
 */
export enum PARSE_TYPEDARRAY {
  CANVAS_FORTRAN_RGBA="CANVAS_FORTRAN_RGBA",
  CANVAS_COLORMAP_RGBA="CANVAS_COLORMAP_RGBA",
  RAW_ARRAY="RAW_ARRAY",
}

type ProcessTypedArrayResult = {
  [PARSE_TYPEDARRAY.CANVAS_FORTRAN_RGBA]: {
    input: null
    output: {
      type: PARSE_TYPEDARRAY
      result: Uint8ClampedArray
    }
  }
  [PARSE_TYPEDARRAY.CANVAS_COLORMAP_RGBA]: {
    input?: {
      colormap?: EnumColorMapName
      log?: boolean
    }
    output: {
      type: PARSE_TYPEDARRAY
      result: Uint8ClampedArray
      max: number
      min: number
    }
  }
  [PARSE_TYPEDARRAY.RAW_ARRAY]: {
    input: null
    output: {
      rawArray: number[][]
      min: number
      max: number
    }
  }
}
