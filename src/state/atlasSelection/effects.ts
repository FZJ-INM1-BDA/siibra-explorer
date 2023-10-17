import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { forkJoin, merge, NEVER, Observable, of } from "rxjs";
import { catchError, filter, map, mapTo, switchMap, switchMapTo, take, withLatestFrom } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import * as mainActions from "../actions"
import { select, Store } from "@ngrx/store";
import { selectors, actions } from '.'
import { AtlasSelectionState } from "./const"
import { atlasAppearance, atlasSelection } from "..";

import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

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

const prefParcId = [
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-300",
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290",
]

const prefSpcId = []

@Injectable()
export class Effect {

  onTemplateParcSelectionPostHook: ((arg: OnTmplParcHookArg) => Observable<Partial<AtlasSelectionState>>)[] = [
    /**
     * This hook gets the region associated with the selected parcellation and template,
     * and then set selectedParcellationAllRegions to it
     */
    ({ current }) => {
      const { parcellation } = current
      if (!parcellation) return NEVER
      return this.sapiSvc.getParcRegions(parcellation.id).pipe(
        map(regions => {
          return {
            selectedParcellationAllRegions: regions
          }
        }))
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

      return this.store.pipe(
        select(atlasSelection.selectors.navigation),
        take(1),
        switchMap(({ position, ...rest }) => 
        
          /**
           * if either space name is undefined, return default state for navigation
           */
          !prevSpcName || !currSpcName
          ? of({ navigation: { position, ...rest } })
          : this.interSpaceCoordXformSvc.transform(prevSpcName, currSpcName, position as [number, number, number]).pipe(
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
      map(({ template, requested }) => {
        return {
          template,
          parcellation: null as SxplrParcellation,
          requested,
        }
      })
    ),
    this.action.pipe(
      ofType(actions.selectParcellation),
      map(({ parcellation, requested }) => {
        return {
          template: null as SxplrTemplate,
          parcellation,
          requested,
        }
      })
    )
  ).pipe(
    withLatestFrom(this.store),
    switchMap(([ { template, parcellation, requested }, store ]) => {

      const currTmpl = selectors.selectedTemplate(store)
      const currParc = selectors.selectedParcellation(store)
      const currAtlas = selectors.selectedAtlas(store)

      const requestedTmpl = requested?.template
      const requestedParc = requested?.parcellation

      const resolvedTmpl = template || requestedTmpl || currTmpl
      const resolvedParc = parcellation || requestedParc || currParc

      return this.sapiSvc.getSupportedTemplates(currAtlas, resolvedParc).pipe(
        switchMap(tmpls => {
          const flag = tmpls.some(tmpl => tmpl.id === resolvedTmpl.id)
          if (flag) {
            return of({
              atlas: currAtlas,
              template: resolvedTmpl,
              parcellation: resolvedParc,
            })
          }

          /**
           * TODO code below should not be reached
           */
          /**
           * if template is defined, find the first parcellation that is supported
           */
          if (!!template) {
            return this.sapiSvc.getSupportedParcellations(currAtlas, template).pipe(
              map(parcs => {
                if (parcs.length === 0) {
                  throw new Error(`Cannot find any supported parcellations for template ${template.name}`)
                }
                const sortedByPref = parcs.sort((a, b) => prefParcId.indexOf(a.id) - prefParcId.indexOf(b.id))
                const selectParc = sortedByPref.find(p => requestedParc?.id === p.id) || sortedByPref[0]
                return {
                  atlas: currAtlas,
                  template,
                  parcellation: selectParc
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
                const selectTmpl = templates.find(tmp => requestedTmpl?.id === tmp.id || prefSpcId.includes(tmp.id)) || templates[0]
                return {
                  atlas: currAtlas,
                  template: selectTmpl,
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

  onAtlasSelClearTmplParc = createEffect(() => this.action.pipe(
    ofType(actions.selectAtlas),
    map(() => actions.setAtlasSelectionState({
      selectedTemplate: null,
      selectedParcellation: null,
    })),
  ))

  onAtlasSelectionSelectTmplParc = createEffect(() => this.action.pipe(
    ofType(actions.selectAtlas),
    filter(action => !!action.atlas),
    switchMap(({ atlas }) => 
      this.sapiSvc.getAllParcellations(atlas).pipe(
        map(parcellations => {
          const parcPrevIds = parcellations.map(p => p.prevId)
          const latestParcs = parcellations.filter(p => !parcPrevIds.includes(p.id))
          const prefParc = parcellations.filter(p => prefParcId.includes(p.id)).sort((a, b) => prefParcId.indexOf(a.id) - prefParcId.indexOf(b.id))
          const selectedParc = prefParc[0] || latestParcs[0] || parcellations[0]
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
        map.set(region, region.color)
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
    switchMap(({ atlasId, parcellationId, templateId }) =>
      this.sapiSvc.atlases$.pipe(
        switchMap(atlases => {

          const selectedAtlas = atlasId
            ? atlases.find(atlas => atlas.id === atlasId)
            : atlases[0]

          if (!selectedAtlas) {
            return of(
              mainActions.generalActionError({
                message: `Atlas with id ${atlasId} not found!`
              })
            )
          }
          return this.sapiSvc.getAllParcellations(selectedAtlas).pipe(
            switchMap(parcs => {
              const selectedParcellation = parcellationId
                ? parcs.find(parc => parc.id === parcellationId)
                : parcs[0]
              if (!selectedParcellation) {
                return of(
                  mainActions.generalActionError({
                    message: `Parcellation with id ${parcellationId} not found!`
                  })
                )
              }
              return this.sapiSvc.getSupportedTemplates(selectedAtlas, selectedParcellation).pipe(
                switchMap(templates => {
                  const selectedTemplate = templateId
                    ? templates.find(tmpl => tmpl.id === templateId)
                    : templates[0]
                  if (!selectedTemplate) {
                    return of(
                      mainActions.generalActionError({
                        message: `Template with id ${templateId} not found`
                      })
                    )
                  }
                  return of(
                    actions.setAtlasSelectionState({
                      selectedAtlas,
                      selectedParcellation,
                      selectedTemplate
                    })
                  )
                })
              )
            })
          )
        })
      )
    )
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
      return this.sapiSvc.v3Get("/regions/{region_id}", {
        path: {
          region_id: _region.name
        },
        query: {
          parcellation_id: selectedParcellation.id,
          space_id: selectedTemplate.id
        }
      }).pipe(
        map(reg => actions.navigateTo({
          animation: true,
          navigation: {
            position: reg.hasAnnotation.bestViewPoint.coordinates.map(v => v.value * 1e6)
          }
        })),
        catchError(() => of(
          mainActions.generalActionError({
            message: `getting region detail error! cannot get coordinates`
          })
        )),
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

  onRegionSelectionClearPointSelection = createEffect(() => this.action.pipe(
    ofType(actions.selectRegion),
    map(() => actions.clearSelectedPoint())
  ))

  onPointSelectionClearRegionSelection = createEffect(() => this.action.pipe(
    ofType(actions.selectPoint),
    map(() => actions.clearSelectedRegions())
  ))

  constructor(
    private action: Actions,
    private sapiSvc: SAPI,
    private store: Store,
    private interSpaceCoordXformSvc: InterSpaceCoordXformSvc,
  ){
  }
}