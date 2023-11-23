import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { forkJoin, from, NEVER, Observable, of, throwError } from "rxjs";
import { catchError, filter, map, mapTo, switchMap, take, withLatestFrom } from "rxjs/operators";
import { IDS, SAPI } from "src/atlasComponents/sapi";
import * as mainActions from "../actions"
import { select, Store } from "@ngrx/store";
import { selectors, actions, fromRootStore } from '.'
import { AtlasSelectionState } from "./const"
import { atlasAppearance, atlasSelection } from "..";

import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { DecisionCollapse } from "src/atlasComponents/sapi/decisionCollapse.service";
import { DialogFallbackCmp } from "src/ui/dialogInfo";
import { MatDialog } from 'src/sharedModules/angularMaterial.exports'

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
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-310",
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-300",
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290",
]

@Injectable()
export class Effect {

  #askUserATP<T extends SxplrAtlas|SxplrTemplate|SxplrParcellation>(titleMd: string, options: T[]) {
    if (options.length === 0) {
      return throwError(`Expecting at least one option, but got 0`)
    }
    if (options.length === 1) {
      return of(options[0])
    }
    return this.dialog.open(DialogFallbackCmp, {
      data: {
        titleMd,
        actions: options.map(v => v.name),
        actionsAsList: true
      }
    }).afterClosed().pipe(
      map(v => options.find(o => o.name === v))
    )
  }

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
        switchMap(navigation => 
          /**
           * if either space name is undefined, return default state for navigation
           */
          !prevSpcName || !currSpcName
          ? of({ navigation })
          : this.interSpaceCoordXformSvc.transform(prevSpcName, currSpcName, navigation.position as [number, number, number]).pipe(
            map(value => {
              if (value.status === "error") {
                return {}
              }
              return {
                navigation: {
                  ...navigation,
                  position: value.result,
                }
              } as Partial<AtlasSelectionState>
            })
          )
        )
      )
    }
  ]

  /**
   * clear template/parc to trigger loading screen
   * since getting the map/config etc are not sync
   */
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
    map(({ atlas }) => actions.selectATPById({
      atlasId: atlas.id,
      config: {
        autoSelect: true,
      }
    }))
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
    switchMap(({ atlasId, parcellationId, templateId, regionId, config }) => {
      const { autoSelect, messages } = config || { autoSelect: false, messages: {} }
      return from(
        Promise.all([
          atlasId && this.collapser.collapseAtlasId(atlasId),
          templateId && this.collapser.collapseTemplateId(templateId),
          parcellationId && this.collapser.collapseParcId(parcellationId),
        ])
      ).pipe(
        withLatestFrom(this.store.pipe(
          fromRootStore.distinctATP()
        )),
        switchMap(([requestedPossibleATPs, { atlas, template, parcellation }]) => {
          const result = DecisionCollapse.Intersect(...requestedPossibleATPs)
          
          const errorMessages = DecisionCollapse.Verify(result)
          if (errorMessages.length > 0) {
            const errMessage = `Cannot process selectATP with parameter ${atlasId}, ${parcellationId}, ${templateId} and ${regionId}. ${errorMessages.join(" ")}`
            return throwError(errMessage)
          }

          /**
           * narrow down the valid atlas, template and parcellation according to the current state
           * If intersection is None, then leave the possibility intact
           */
          const foundAtlas = atlas && result.atlases.find(a => a.id === atlas.id)
          const foundParc = parcellation && result.parcellations.find(a => a.id === parcellation.id)
          const foundSpace = template && result.spaces.find(a => a.id === template.id)

          const prevNextParcs = (() => {
            if (!parcellation) {
              return []
            }
            const FUSE = 10
            let prevParcId = parcellation.prevId
            let currentParcId = parcellation.id
            let breakPrev = false
            let breakNext = false
            let iter = 0
            const returnArr = []
            // eslint-disable-next-line no-constant-condition
            while (true) {
              if (iter > FUSE || (breakPrev && breakNext)) {
                break
              }
              iter ++
              if (!breakPrev) {
                const prevParc = result.parcellations.find(p => p.id === prevParcId)
                if (prevParc) {
                  returnArr.push(prevParc)
                  prevParcId = prevParc.prevId
                } else {
                  breakPrev = true
                }
              }
              if (!breakNext) {
                const nextParc = result.parcellations.find(p => p.prevId === currentParcId)
                if (nextParc) {
                  returnArr.splice(0, 0, nextParc)
                  currentParcId = nextParc.id
                } else {
                  breakNext = true
                }
              }
            }
            return returnArr
          })()
          
          result.atlases = foundAtlas && [foundAtlas] || result.atlases
          result.parcellations = foundParc && [foundParc] || prevNextParcs[0] && [prevNextParcs[0]] || result.parcellations
          result.spaces = foundSpace && [foundSpace] || result.spaces

          /**
           * 
           * with the remaining possible options, ask user to decide on which atlas/parc/space to select
           */
          const prAskUser = async () => {
            let atlas: SxplrAtlas
            let template: SxplrTemplate
            let parcellation: SxplrParcellation

            if (result.atlases.length === 1) {
              atlas = result.atlases[0]
            }
            if (result.spaces.length === 1) {
              template = result.spaces[0]
            }
            if (result.parcellations.length === 1) {
              parcellation = result.parcellations[0]
            }
            
            if (autoSelect) {
              atlas ||= atlas[0]
              template ||= result.spaces.find(s => s.id === IDS.TEMPLATES.MNI152) || result.spaces[0]

              // on template selection, the possible parcellation may be narrowed
              // as a result, we need to run the collapser to reduce the possible selection
              const newPosATP = await this.collapser.collapseTemplateId(template.id)
              const { parcellations } = DecisionCollapse.Intersect(newPosATP, result)
              result.parcellations = parcellations

              const parcPrevIds = result.parcellations.map(p => p.prevId)
              const latestParcs = result.parcellations.filter(p => !parcPrevIds.includes(p.id))
              const prefParc = result.parcellations.filter(p => prefParcId.includes(p.id)).sort((a, b) => prefParcId.indexOf(a.id) - prefParcId.indexOf(b.id))

              parcellation ||= prefParc[0] || latestParcs[0] || result.parcellations[0]
            }

            atlas ||= await this.#askUserATP("Please select an atlas", result.atlases).toPromise()
            if (!atlas) return // user cancelled
            template ||= await this.#askUserATP(messages.template || "Please select a space", result.spaces).toPromise()
            if (!template) return // user cancelled

            
            // on template selection, the possible parcellation may be narrowed
            // as a result, we need to run the collapser to reduce the possible selection
            const newPosATP = await this.collapser.collapseTemplateId(template.id)
            const { parcellations } = DecisionCollapse.Intersect(newPosATP, result)
            result.parcellations = parcellations

            parcellation ||= await this.#askUserATP(messages.parcellation || "Please select a parcellation", result.parcellations).toPromise()
            if (!parcellation) return // user cancelled

            return {
              atlas,
              template,
              parcellation,
            }
          }
          return from(prAskUser()).pipe(
            switchMap(val => {
              /** user cancelled */
              if (!val) {
                return of(null)
              }
              const { atlas, parcellation, template } = val
              return of({
                atlas, parcellation, template
              })
            }),
            switchMap(current => {
              if (!current) {
                return of(
                  mainActions.noop()
                )
              }
              return forkJoin(
                this.onTemplateParcSelectionPostHook.map(fn =>
                  fn({previous: { atlas, template, parcellation }, current})
                )
              ).pipe(
                map(partialState => {
                  let state: Partial<AtlasSelectionState> = {
                    selectedAtlas: current.atlas,
                    selectedParcellation: current.parcellation,
                    selectedTemplate: current.template
                  }
                  for (const partial of partialState){
                    state = {
                      ...state,
                      ...partial,
                    }
                  }

                  state.selectedRegions = []
                  if (!!regionId) {
                    const selectedRegions = (state.selectedParcellationAllRegions || []).filter(r => r.name === regionId)
                    state.selectedRegions = selectedRegions
                  }
                  
                  return actions.setAtlasSelectionState(state)
                })
              )
            }),
          )
        }),
        catchError((err) => {
          console.warn("Selecting ATP Error!", err)  
          return of(
            mainActions.generalActionError({
              message: err.toString()
            })
          )
        })
      )
    })
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
    private collapser: DecisionCollapse,
    private dialog: MatDialog,
  ){
  }
}