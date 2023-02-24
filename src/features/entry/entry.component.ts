import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, switchMap, tap } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { FeatureBase } from '../base';
import * as userInteraction from "src/state/userInteraction"

const categoryAcc = <T extends Record<string, unknown>>(categories: T[]) => {
  const returnVal: Record<string, T[]> = {}
  for (const item of categories) {
    const { category, ...rest } = item
    if (!category) continue
    if (typeof category !== "string") continue
    if (!returnVal[category]) {
      returnVal[category] = []
    }
    returnVal[category].push(item)
  }
  return returnVal
}

@Component({
  selector: 'sxplr-feature-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss']
})
export class EntryComponent extends FeatureBase {

  constructor(private sapi: SAPI, private store: Store) {
    super()
  }

  private featureTypes$ = this.sapi.v3Get("/feature/_types", {}).pipe(
    switchMap(resp => 
      this.sapi.iteratePages(
        resp,
        page => this.sapi.v3Get(
          "/feature/_types",
          { query: { page } }
        )
      )
    ),
  )

  public cateogryCollections$ = this.TPR$.pipe(
    switchMap(({ template, parcellation, region }) => this.featureTypes$.pipe(
      map(features => {
        const filteredFeatures = features.filter(v => {
          const params = [
            ...(v.path_params || []),
            ...(v.query_params || []),
          ]
          return [
            params.includes("space_id") === (!!template),
            params.includes("parcellation_id") === (!!parcellation),
            params.includes("region_id") === (!!region),
          ].some(val => val)
        })
        return categoryAcc(filteredFeatures)
      }),
    )),
  )

  onClickFeature(feature: Feature) {
    this.store.dispatch(
      userInteraction.actions.showFeature({
        feature
      })
    )
  }
}

