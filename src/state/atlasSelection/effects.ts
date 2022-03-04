import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { forkJoin, merge, of } from "rxjs";
import { filter, map, mapTo, switchMap, withLatestFrom } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import * as actions from "./actions"
import { actions as generalAction } from "../actions"
import { select, Store } from "@ngrx/store";
import { selectors } from '.'

@Injectable()
export class Effect {

  onAtlasSelectionSelectTmplParc = createEffect(() => this.action.pipe(
    ofType(actions.selectAtlas),
    filter(action => !!action.atlas),
    switchMap(action => {
      const selectedParc = action.atlas.parcellations.find(p => /290/.test(p["@id"])) || action.atlas.parcellations[0]
      return this.sapiSvc.getParcDetail(action.atlas["@id"], selectedParc["@id"], 100).then(
        parcellation => ({
          parcellation,
          atlas: action.atlas
        })
      )
    }),
    switchMap(({ atlas, parcellation }) => {
      const spacdIds = parcellation.brainAtlasVersions.map(bas => bas.coordinateSpace) as { "@id": string }[]
      return forkJoin(
        spacdIds.filter(
          spaceId => atlas.spaces.map(spc => spc["@id"]).indexOf(spaceId["@id"]) >= 0
        ).map(spaceId =>
          this.sapiSvc.getSpaceDetail(atlas["@id"], spaceId["@id"])
        )
      ).pipe(
        switchMap(spaces => {
          const selectedSpace = spaces.find(s => /152/.test(s.fullName)) || spaces[0]
          return of(
            actions.selectTemplate({
              template: selectedSpace
            }),
            actions.selectParcellation({
              parcellation
            })
          )
        })
      )
    }),
  ))

  onAtlasSelClearStandAloneVolumes = createEffect(() => this.action.pipe(
    ofType(actions.selectAtlas),
    mapTo(actions.setStandAloneVolumes({
      standAloneVolumes: []
    }))
  ))

  onClearRegion = createEffect(() => this.action.pipe(
    ofType(actions.clearSelectedRegions),
    mapTo(actions.selectRegions({
      regions: []
    }))
  ))

  onNonBaseLayerRemoval = createEffect(() => this.action.pipe(
    ofType(actions.clearNonBaseParcLayer),
    mapTo(generalAction.generalActionError({
      message: `NYI`
    }))
  ))

  onClearStandAloneVolumes = createEffect(() => this.action.pipe(
    ofType(actions.clearStandAloneVolumes),
    mapTo(actions.setStandAloneVolumes({
      standAloneVolumes: []
    }))
  ))

  /**
   * nb for template selection
   * navigation should be transformed
   * see selectTemplate$ in spec.ts
   */
  onSelectATPById = createEffect(() => this.action.pipe(
    ofType(actions.selectATPById),
    mapTo(generalAction.generalActionError({
      message: `NYI`
    }))
  ))

  /**
   * consider what happens if it was nehuba viewer?
   * what happens if it was three surfer viewer?
   */
  onNavigateTo = createEffect(() => this.action.pipe(
    ofType(actions.navigateTo),
    mapTo(generalAction.generalActionError({
      message: `NYI`
    }))
  ))

  onClearViewerMode = createEffect(() => this.action.pipe(
    ofType(actions.clearViewerMode),
    mapTo(actions.setViewerMode({ viewerMode: null }))
  ))

  onToggleRegionSelectById = createEffect(() => this.action.pipe(
    ofType(actions.toggleRegionSelectById),
    mapTo(generalAction.generalActionError({
      message: `NYI`
    }))
  ))

  onNavigateToRegion = createEffect(() => this.action.pipe(
    ofType(actions.navigateToRegion),
    mapTo(generalAction.generalActionError({
      message: `NYI`
    }))
  ))

  onSelAtlasTmplParcClearRegion = createEffect(() => merge(
    this.action.pipe(
      ofType(actions.selectAtlas)
    ),
    this.action.pipe(
      ofType(actions.selectTemplate)
    ),
    this.action.pipe(
      ofType(actions.selectParcellation)
    )
  ).pipe(
    mapTo(actions.selectRegions({
      regions: []
    }))
  ))

  onRegionToggleSelect = createEffect(() => this.action.pipe(
    ofType(actions.toggleRegionSelect),
    withLatestFrom(
      this.store.pipe(
        select(selectors.selectedRegions)
      )
    ),
    map(([ { region }, regions ]) => {
      const selectedRegionsIndicies = regions.map(r => r["@id"])
      const roiIndex = selectedRegionsIndicies.indexOf(region["@id"])
      return actions.selectRegions({
        regions: roiIndex >= 0
          ? [...regions.slice(0, roiIndex), ...regions.slice(roiIndex + 1)]
          : [...regions, region]
      })
    })
  ))

  constructor(
    private action: Actions,
    private sapiSvc: SAPI,
    private store: Store,
  ){

  }
}