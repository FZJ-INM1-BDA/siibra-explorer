import { SAPI } from "..";
import { SapiRegionModel, RouteParam } from "../type_v3";
import { strToRgb, hexToRgb } from 'common/util'
import { NEVER, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { SAPIBase } from "./base";
import { SxplrRegion } from "../type_sxplr";

/**
 * All valid region features
 */
const RegionFeatures = {
  // ReceptorDensityFingerprint: "ReceptorDensityFingerprint",
  // GeneExpressions: "GeneExpressions",
  // EbrainsDataFeature: "EbrainsDataFeature",
  
  // ReceptorDensityProfile: "ReceptorDensityProfile",
  // BigBrainIntensityProfile: "BigBrainIntensityProfile",
  // CellDensityProfile: "CellDensityProfile",
  // LayerwiseBigBrainIntensities: "LayerwiseBigBrainIntensities",
  // LayerwiseCellDensity: "LayerwiseCellDensity",
  
  Tabular: "Tabular",
  CorticalProfile: "CorticalProfile",
} as const

type RF = keyof typeof RegionFeatures

export class SAPIRegion extends SAPIBase<RF>{

  static GetDisplayColor(region: SxplrRegion): [number, number, number]{
    if (!region) {
      throw new Error(`region must be provided!`)
    }
    return region.color
    // if (region.hasAnnotation?.displayColor) {
    //   return hexToRgb(region.hasAnnotation.displayColor)
    // }
    // return strToRgb(JSON.stringify(region))
  }


  constructor(
    private sapi: SAPI,
    public atlasId: string,
    public parcId: string,
    public id: string,
  ){
    super(sapi)
  }

  static Features: RF[] = Object.keys(RegionFeatures) as RF[]
  static Features$ = of(SAPIRegion.Features)
  public features$ = SAPIRegion.Features$

  /**
   * @param spaceId 
   * @returns 
   */
  getMapInfo(spaceId: string): Observable<{min: number, max: number}> {
    return this.sapi.v3Get("/map/statistical_map.info.json", {
      query: {
        parcellation_id: this.parcId,
        region_id: this.id,
        space_id: spaceId
      }
    })
  }

  /**
   * @param spaceId 
   * @returns 
   */
  getMapUrl(spaceId: string): Observable<string> {
    return SAPI.BsEndpoint$.pipe(
      map(endpoint => {
        const { path, params } =  this.sapi.v3GetRoute("/map/statistical_map.nii.gz", {
          query: {
            parcellation_id: this.parcId,
            region_id: this.id,
            space_id: spaceId
          }
        })

        const search = new URLSearchParams()
        for (const key in params) {
          search.set(key, params[key].toString())
        }

        return `${endpoint}${path}?${search.toString()}`
      })
    )
  }

  /**
   * 
   * @deprecated
   * @param volumeId 
   * @returns 
   */
  getVolumeInstance(volumeId: string): Observable<never> {
    return NEVER
  }

  getDetail(spaceId: string): Observable<SapiRegionModel> {
    return this.sapi.v3Get("/regions/{region_id}", {
      path: {
        region_id: this.id
      },
      query: {
        parcellation_id: this.parcId,
        space_id: spaceId
      }
    })
  }

  getMap(spaceId: string, mapType: RouteParam<"/map">['query']['map_type']) {
    return this.sapi.v3Get("/map", {
      query: {
        space_id: spaceId,
        parcellation_id: this.parcId,
        map_type: mapType,
      }
    })
  }
}
