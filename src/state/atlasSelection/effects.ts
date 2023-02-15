import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { forkJoin, merge, Observable, of } from "rxjs";
import { catchError, filter, map, mapTo, switchMap, switchMapTo, take, withLatestFrom } from "rxjs/operators";
import { SAPI, SAPIRegion } from "src/atlasComponents/sapi";
import * as mainActions from "../actions"
import { select, Store } from "@ngrx/store";
import { selectors, actions } from '.'
import { AtlasSelectionState } from "./const"
import { atlasAppearance, atlasSelection } from "..";

import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service";
import { translateV3Entities } from "src/atlasComponents/sapi/translate_v3"
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/type_sxplr";

type OnTmplParcHookArg = {
  previous: {
    atlas: SxplrAtlas
    template: SxplrTemplate
    parcellation: SxplrParcellation
  }
  current: {
    atlas: SxplrAtlas
    template: SxplrTemplate
    parcellation: SxplrParcellation
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
          ? this.sapiSvc.getParcRegions(atlas.id, parcellation.id, template.id)
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
      const prevSpcName = InterSpaceCoordXformSvc.TmplIdToValidSpaceName(previous?.template?.id)
      const currSpcName = InterSpaceCoordXformSvc.TmplIdToValidSpaceName(current?.template?.id)

      /**
       * if trans-species, return default state for navigation
       */
      if (previous?.atlas?.id !== current?.atlas?.id) {
        return of({
          navigation: null
        })
      }

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

  onTemplateParcSelection = createEffect(() => merge(
    this.action.pipe(
      ofType(actions.selectTemplate),
      map(({ template }) => {
        return {
          template,
          parcellation: null as SxplrParcellation
        }
      })
    ),
    this.action.pipe(
      ofType(actions.selectParcellation),
      map(({ parcellation }) => {
        return {
          template: null as SxplrTemplate,
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
      return this.sapiSvc.getSupportedTemplates(currAtlas, parcellation || currParc).pipe(
        switchMap(tmpls => {
          const flag = tmpls.some(tmpl => tmpl.id === (template || currTmpl).id)
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
            return this.sapiSvc.getSupportedParcellations(currAtlas, template).pipe(
              map(parcs => {
                if (parcs.length === 0) {
                  throw new Error(`Cannot find any supported parcellations for template ${template.name}`)
                }
                return {
                  atlas: currAtlas,
                  template,
                  parcellation: parcs[0]
                }
              })
            )
          }
          if (!!parcellation) {
            return this.sapiSvc.getSupportedTemplates(currAtlas, parcellation).pipe(
              map(templates => {
                if (templates.length === 0) {
                  throw new Error(`Cannot find any supported templates for parcellation ${parcellation.name}`)
                }
                return {
                  atlas: currAtlas,
                  template: templates[0],
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
              console.log('selected teplate', template, parcellation)
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
    switchMap(({ atlas }) => 
      this.sapiSvc.getAllParcellations(atlas).pipe(
        map(parcellations => {
          const selectedParc = parcellations.find(p => p.id.includes("290")) || parcellations[0]
          return {
            parcellation: selectedParc,
            atlas
          }
        })
      )
    ),
    switchMap(({ atlas, parcellation }) => {
      return this.sapiSvc.getSupportedTemplates(atlas, parcellation).pipe(
        switchMap(spaces => {
          const selectedSpace = spaces.find(s => s.name.includes("152")) || spaces[0]
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
      const map = new Map<SxplrRegion, number[]>()
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
    withLatestFrom(
      this.store.pipe(
        select(selectors.selectedTemplate)
      ),
      this.store.pipe(
        select(selectors.selectedAtlas)
      ),
      this.store.pipe(
        select(selectors.selectedParcellation)
      )
    ),
    switchMap(([{ region: _region }, selectedTemplate, selectedAtlas, selectedParcellation]) => {
      if (!selectedAtlas || !selectedTemplate || !selectedParcellation || !_region)  {
        return of(
          mainActions.generalActionError({
            message: `atlas, template, parcellation or region not set`
          })
        )
      }

      const region = translateV3Entities.retrieveRegion(_region)

      if (region.hasAnnotation?.bestViewPoint && region.hasAnnotation.bestViewPoint.coordinateSpace['@id'] === selectedTemplate["@id"]) {
        return of(
          actions.navigateTo({
            animation: true,
            navigation: {
              position: region.hasAnnotation.bestViewPoint.coordinates.map(v => v.value * 1e6)
            }
          })
        )
      }
      
      return this.sapiSvc.getRegion(selectedAtlas['@id'], selectedParcellation['@id'], region["@id"]).getDetail(selectedTemplate["@id"]).pipe(
        map(detailedRegion => {
          if (!detailedRegion?.hasAnnotation?.bestViewPoint?.coordinates) {
            return mainActions.generalActionError({
              message: `getting region detail error! cannot get coordinates`
            })
          }
          return actions.navigateTo({
            animation: true,
            navigation: {
              position: detailedRegion.hasAnnotation.bestViewPoint.coordinates.map(v => v.value * 1e6)
            }
          })
        }),
        catchError((_err, _obs) => of(
          mainActions.generalActionError({
            message: `Error getting region centroid`
          })
        ))
      )
    })
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