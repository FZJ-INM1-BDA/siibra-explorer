import { Directive } from "@angular/core";
import { map, switchMap } from "rxjs/operators";
import { FeatureBase } from "./base";
import { SAPI } from "src/atlasComponents/sapi";

const categoryAcc = <T extends Record<string, unknown>>(categories: T[]) => {
  const returnVal: Record<string, T[]> = {}
  for (const item of categories) {
    const { category } = item
    if (!category) continue
    if (typeof category !== "string") continue
    if (!returnVal[category]) {
      returnVal[category] = []
    }
    returnVal[category].push(item)
  }
  return returnVal
}

@Directive({
  selector: '[tpbr-category]',
  exportAs: 'tpbrCategory'
})

export class TPBRCategoryDirective extends FeatureBase{

  constructor(protected sapi: SAPI){
    super()
  }
  
  protected featureTypes$ = this.sapi.v3Get("/feature/_types", {}).pipe(
    switchMap(resp => 
      this.sapi.iteratePages(
        resp,
        page => this.sapi.v3Get(
          "/feature/_types",
          { query: { page } }
        )
      )
    ),
    // monnkey patch geometry features
    map(features => {
      return [
        ...features,
        {
          category: "geometry",
          display_name: "Geometry Features",
          name: "features.fiction.GeometryFeatures",
          query_params: [
            "space_id",
            "bbox"
          ],
          required_query_params: [
            "space_id"
          ],
          optional_query_params: [
            "bbox"
          ],
          path: "/feature/Geom"
        }
      ]
    })
  )

  public cateogryCollections$ = this.TPRBbox$.pipe(
    switchMap(({ template, parcellation, region, bbox }) => this.featureTypes$.pipe(
      map(features => {
        const filteredFeatures = features.filter(v => {
          const { path_params, required_query_params } = v
          
          const requiredParams = [
            ...(path_params || []),
            ...(required_query_params || []),
          ]
          const paramMapped = {
            space_id: !!template,
            parcellation_id: !!parcellation,
            region_id: !!region,
            bbox: !!bbox
          } as Record<string, boolean>

          for (const pParam in paramMapped){
            if (requiredParams.includes(pParam) && !paramMapped[pParam]) {
              return false
            }
          }
          return true
        })
        return categoryAcc(filteredFeatures)
      }),
    )),
  )
}