import { Inject, Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { BS_ENDPOINT } from 'src/util/constants';
import { map, shareReplay, take, tap } from "rxjs/operators";
import { SAPIAtlas, SAPISpace } from './core'
import { SapiAtlasModel, SapiParcellationModel, SapiRegionalFeatureModel, SapiRegionModel, SapiSpaceModel } from "./type";
import { CachedFunction } from "src/util/fn";
import { SAPIParcellation } from "./core/sapiParcellation";
import { SAPIRegion } from "./core/sapiRegion"
import { MatSnackBar } from "@angular/material/snack-bar";

export const SIIBRA_API_VERSION_HEADER_KEY='x-siibra-api-version'
export const SIIBRA_API_VERSION = '0.2.0'

type RegistryType = SAPIAtlas | SAPISpace | SAPIParcellation

@Injectable()
export class SAPI{

  public bsEndpoint = 'https://siibra-api-dev.apps-dev.hbp.eu/v1_0'
  
  registry = {
    _map: {} as Record<string, {
      func: (...arg: any[]) => RegistryType,
      args: string[]
    }>,
    get<T>(id: string): T {
      if (!this._map[id]) return null
      const { func, args } = this._map[id]
      return func(...args)
    },
    set(id: string, func: (...args: any[]) => RegistryType, args: string[]) {
      if (this._map[id]) {
        console.warn(`id ${id} already mapped as ${this._map[id]}`)
      }
      this._map[id] = { func, args }
    }
  }

  getAtlas(atlasId: string): SAPIAtlas {
    return new SAPIAtlas(this, atlasId)
  }

  getSpace(atlasId: string, spaceId: string): SAPISpace {
    return new SAPISpace(this, atlasId, spaceId)
  }

  getParcellation(atlasId: string, parcId: string): SAPIParcellation {
    return new SAPIParcellation(this, atlasId, parcId)
  }

  getRegion(atlasId: string, parcId: string, regionId: string): SAPIRegion{
    return new SAPIRegion(this, atlasId, parcId, regionId)
  }

  @CachedFunction({
    serialization: (atlasId, spaceId, ...args) => `sapi::getSpaceDetail::${atlasId}::${spaceId}`
  })
  getSpaceDetail(atlasId: string, spaceId: string, priority = 0): Promise<SapiSpaceModel> {
    return this.getSpace(atlasId, spaceId).getDetail()
  }

  @CachedFunction({
    serialization: (atlasId, parcId, ...args) => `sapi::getParcDetail::${atlasId}::${parcId}`
  })
  getParcDetail(atlasId: string, parcId: string, priority = 0): Promise<SapiParcellationModel> {
    return this.getParcellation(atlasId, parcId).getDetail()
  }

  @CachedFunction({
    serialization: (atlasId, parcId, spaceId, ...args) => `sapi::getRegions::${atlasId}::${parcId}::${spaceId}`
  })
  getParcRegions(atlasId: string, parcId: string, spaceId: string, priority = 0): Promise<SapiRegionModel[]> {
    const parc = this.getParcellation(atlasId, parcId)
    return parc.getRegions(spaceId)
  }

  @CachedFunction({
    serialization: (atlasId, parcId, spaceId, regionId, ...args) => `sapi::getRegions::${atlasId}::${parcId}::${spaceId}::${regionId}`
  })
  getRegionFeatures(atlasId: string, parcId: string, spaceId: string, regionId: string, priority = 0): Promise<SapiRegionalFeatureModel[]>{

    const reg = this.getRegion(atlasId, parcId, regionId)
    return reg.getFeatures(spaceId)
  }

  @CachedFunction({
    serialization: (url, params) => `sapi::cachedGet::${url}::${JSON.stringify(params)}`
  })
  cachedGet<T>(url: string, option?: Record<string, any>) {
    return this.http.get<T>(url, option).toPromise()
  }


  public atlases$ = this.http.get<SapiAtlasModel[]>(
    `${this.bsEndpoint}/atlases`,
    {
      observe: "response"
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
    map(resp => resp.body),
    shareReplay(1)
  )

  constructor(
    public http: HttpClient,
    private snackbar: MatSnackBar,
    // @Inject(BS_ENDPOINT) public bsEndpoint: string,
  ){
    this.atlases$.subscribe(atlases => {
      for (const atlas of atlases) {
        for (const space of atlas.spaces) {
          this.registry.set(space["@id"], this.getSpace.bind(this), [atlas["@id"], space["@id"]])
          this.getSpaceDetail(atlas["@id"], space["@id"])
        }
        for (const parc of atlas.parcellations) {
          this.registry.set(parc["@id"], this.getParcellation.bind(this), [atlas["@id"], parc["@id"]])
          this.getParcDetail(atlas["@id"], parc["@id"])
        }
      }
    })
  }
}
