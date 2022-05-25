import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { concat, forkJoin, merge, Observable, of } from "rxjs";
import { filter, map, mapTo, switchMap, switchMapTo, take, tap, withLatestFrom } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SAPIRegion, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import * as mainActions from "../actions"
import { select, Store } from "@ngrx/store";
import { selectors, actions } from '.'
import { fromRootStore } from "./util";
import { AtlasSelectionState } from "./const"
import { ParcellationIsBaseLayer } from "src/atlasComponents/sapiViews/core/parcellation/parcellationIsBaseLayer.pipe";
import { OrderParcellationByVersionPipe } from "src/atlasComponents/sapiViews/core/parcellation/parcellationVersion.pipe";
import { atlasAppearance, atlasSelection } from "..";
import { ParcellationSupportedInSpacePipe } from "src/atlasComponents/sapiViews/util/parcellationSupportedInSpace.pipe";
import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service";

type OnTmplParcHookArg = {
  previous: {
    atlas: SapiAtlasModel
    template: SapiSpaceModel
    parcellation: SapiParcellationModel
  }
  current: {
    atlas: SapiAtlasModel
    template: SapiSpaceModel
    parcellation: SapiParcellationModel
  }
}

@Injectable()
export class Effect {

  onTemplateParcSelectionPostHook: ((arg: OnTmplParcHookArg) => Observable<Partial<AtlasSelectionState>>)[] = [
    /**
     * This hook gets the region associated with the selected parcellation and template,
     * and then set selectedParcellationAllRegions to it
     */
    ({ current }) => {
      const { atlas, parcellation, template } = current
      return (
        !!atlas && !!parcellation && !!template
          ? this.sapiSvc.getParcRegions(atlas["@id"], parcellation["@id"], template["@id"])
          : of([])
      ).pipe(
        map(regions => {
          return {
            selectedParcellationAllRegions: regions
          }
        })
      )
    },
    ({ current, previous }) => {
      const prevSpcName = InterSpaceCoordXformSvc.TmplIdToValidSpaceName(previous.template["@id"])
      const currSpcName = InterSpaceCoordXformSvc.TmplIdToValidSpaceName(current.template["@id"])
      /**
       * if either space name is undefined, return default state for navigation
       */
      if (!prevSpcName || !currSpcName) {
        return of({
          navigation: atlasSelection.defaultState.navigation
        })
      }
      return this.store.pipe(
        select(atlasSelection.selectors.navigation),
        take(1),
        switchMap(({ position, ...rest }) => 
          this.interSpaceCoordXformSvc.transform(prevSpcName, currSpcName, position as [number, number, number]).pipe(
            map(value => {
              if (value.status === "error") {
                return {}
              }
              return {
                navigation: {
                  ...rest,
                  position: value.result,
                }
              } as Partial<AtlasSelectionState>
            })
          )
        )
      )
    }
  ]

  parcSupportedInSpacePipe = new ParcellationSupportedInSpacePipe(this.sapiSvc)
  onTemplateParcSelection = createEffect(() => merge<{ template: SapiSpaceModel, parcellation: SapiParcellationModel }>(
    this.action.pipe(
      ofType(actions.selectTemplate),
      map(({ template }) => {
        return {
          template,
          parcellation: null
        }
      })
    ),
    this.action.pipe(
      ofType(actions.selectParcellation),
      map(({ parcellation }) => {
        return {
          template: null,
          parcellation
        }
      })
    )
  ).pipe(
    withLatestFrom(this.store),
    switchMap(([ { template, parcellation }, store ]) => {
      const currTmpl = selectors.selectedTemplate(store)
      const currParc = selectors.selectedParcellation(store)
      const currAtlas = selectors.selectedAtlas(store)
      return this.parcSupportedInSpacePipe.transform(
        parcellation || currParc,
        template || currTmpl
      ).pipe(
        switchMap(flag => {
          /**
           * if desired parc is supported in tmpl, emit them
           */
          if (flag) {
            return of({
              atlas: currAtlas,
              template: template || currTmpl,
              parcellation: parcellation || currParc,
            })
          }
          /**
           * if template is defined, find the first parcellation that is supported
           */
          if (!!template) {
            return concat(
              ...currAtlas.parcellations.map(
                p => this.parcSupportedInSpacePipe.transform(p["@id"], template).pipe(
                  filter(flag => flag),
                  switchMap(() => this.sapiSvc.getParcDetail(currAtlas["@id"], p['@id'])),
                )
              )
            ).pipe(
              take(1),
              map(parcellation => {
                return {
                  atlas: currAtlas,
                  template,
                  parcellation
                }
              })
            )
          }
          if (!!parcellation) {
            return concat(
              ...currAtlas.spaces.map(
                sp => this.parcSupportedInSpacePipe.transform(parcellation["@id"], sp["@id"]).pipe(
                  filter(flag => flag),
                  switchMap(() => this.sapiSvc.getSpaceDetail(currAtlas["@id"], sp['@id'])),
                )
              )
            ).pipe(
              take(1),
              map(template => {
                return {
                  atlas: currAtlas,
                  template,
                  parcellation
                }
              })
            )
          }
          throw new Error(`neither template nor parcellation has been defined!`)
        }),
        switchMap(({ atlas, template, parcellation }) => 
          forkJoin(
            this.onTemplateParcSelectionPostHook.map(fn => fn({ previous: { atlas: currAtlas, template: currTmpl, parcellation: currParc }, current: { atlas, template, parcellation } }))
          ).pipe(
            map(partialStates => {
              let returnState: Partial<AtlasSelectionState> = {
                selectedAtlas: atlas,
                selectedTemplate: template,
                selectedParcellation: parcellation
              }
              for (const s of partialStates) {
                returnState = {
                  ...returnState,
                  ...s,
                }
              }
              return actions.setAtlasSelectionState(returnState)
            })
          )
        )
      )
    })
  ))

  onAtlasSelectionSelectTmplParc = createEffect(() => this.action.pipe(
    ofType(actions.selectAtlas),
    filter(action => !!action.atlas),
    switchMap(({ atlas }) => {
      const selectedParc = atlas.parcellations.find(p => /290/.test(p["@id"])) || atlas.parcellations[0]
      return this.sapiSvc.getParcDetail(atlas["@id"], selectedParc["@id"], { priority: 10 }).pipe(
        map(parcellation => {
          return {
            parcellation,
            atlas
          }
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
          return forkJoin(
            this.onTemplateParcSelectionPostHook.map(fn => fn({ previous: null, current: { atlas, parcellation, template: selectedSpace } }))
          ).pipe(
            map(partialStates => {

              let returnState: Partial<AtlasSelectionState> = {
                selectedAtlas: atlas,
                selectedTemplate: selectedSpace,
                selectedParcellation: parcellation
              }
              for (const s of partialStates) {
                returnState = {
                  ...returnState,
                  ...s,
                }
              }
              return actions.setAtlasSelectionState(returnState)
            })
          )
        })
      )
    })
  ))

  onATPSelectionClearBaseLayerColorMap = createEffect(() => this.store.pipe(
    select(selectors.selectedParcAllRegions),
    withLatestFrom(
      this.store.pipe(
        select(atlasAppearance.selectors.customLayers),
        map(layers => layers.filter(l => l.clType === "baselayer/colormap"))
      )
    ),
    switchMap(([regions, layers]) => {
      const map = new Map<SapiRegionModel, number[]>()
      for (const region of regions) {
        map.set(region, SAPIRegion.GetDisplayColor(region))
      }
      const actions = [
        ...layers.map(({ id }) =>
          atlasAppearance.actions.removeCustomLayer({
            id
          })
        ),
        atlasAppearance.actions.addCustomLayer({
          customLayer: {
            clType: "baselayer/colormap",
            id: 'base-colormap-id',
            colormap: map
          }
        })
      ]
      return of(...actions)
    })
  ))


  onAtlasSelClearStandAloneVolumes = createEffect(() => this.action.pipe(
    ofType(actions.selectAtlas),
    mapTo(actions.setStandAloneVolumes({
      standAloneVolumes: []
    }))
  ))

  onClearRegion = createEffect(() => this.action.pipe(
    ofType(actions.clearSelectedRegions),
    mapTo(actions.setSelectedRegions({
      regions: []
    }))
  ))

  onNonBaseLayerRemoval = createEffect(() => this.action.pipe(
    ofType(actions.clearNonBaseParcLayer),
    switchMapTo(
      this.store.pipe(
        fromRootStore.allAvailParcs(this.sapiSvc),
        map(parcs => {
          const baseLayers = parcs.filter(this.parcellationIsBaseLayerPipe.transform)
          const newestLayer = this.orderParcellationByVersionPipe.transform(baseLayers)
          return actions.selectParcellation({
            parcellation: newestLayer
          })
        })  
      )
    )
  ))

  private parcellationIsBaseLayerPipe = new ParcellationIsBaseLayer()
  private orderParcellationByVersionPipe = new OrderParcellationByVersionPipe()

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
    mapTo(mainActions.generalActionError({
      message: `NYI, onSelectATPById`
    }))
  ))
  
  onClearViewerMode = createEffect(() => this.action.pipe(
    ofType(actions.clearViewerMode),
    mapTo(actions.setViewerMode({ viewerMode: null }))
  ))

  onToggleRegionSelectById = createEffect(() => this.action.pipe(
    ofType(actions.toggleRegionSelectById),
    mapTo(mainActions.generalActionError({
      message: `NYI onToggleRegionSelectById`
    }))
  ))

  onNavigateToRegion = createEffect(() => this.action.pipe(
    ofType(actions.navigateToRegion),
    mapTo(mainActions.generalActionError({
      message: `NYI onNavigateToRegion`
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
    switchMapTo(
      of(
        actions.setSelectedRegions({
          regions: []
        })
      )
    )
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
      return actions.setSelectedRegions({
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
    private interSpaceCoordXformSvc: InterSpaceCoordXformSvc,
  ){

  }
}