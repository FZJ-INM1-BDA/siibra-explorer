import { Component, Inject, Injectable, InjectionToken, Injector } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { combineLatest, concat, forkJoin, from, NEVER, Observable, of, throwError, TimeoutError } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, filter, map, mapTo, switchMap, take, timeout, withLatestFrom } from "rxjs/operators";
import { IDS, SAPI } from "src/atlasComponents/sapi";
import * as mainActions from "../actions"
import { select, Store } from "@ngrx/store";
import { selectors, actions, fromRootStore } from '.'
import { AtlasSelectionState } from "./const"
import { atlasAppearance, atlasSelection, generalActions } from "..";

import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { DecisionCollapse } from "src/atlasComponents/sapi/decisionCollapse.service";
import { DialogFallbackCmp } from "src/ui/dialogInfo";
import { MatDialog } from 'src/sharedModules/angularMaterial.exports'
import { ResizeObserverService } from "src/util/windowResize/windowResize.service";
import { TViewerEvtCtxData } from "src/viewerModule/viewer.interface";
import { ContextMenuService } from "src/contextMenuModule";
import { NehubaVCtxToBbox } from "src/viewerModule/pipes/nehubaVCtxToBbox.pipe";
import { SxplrSnackBarSvc } from "src/components";
import { SxplrOverlaySvc } from "src/components/overlay";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "src/sharedModules";
import { ComponentPortal } from "@angular/cdk/portal";

const NEHUBA_CTX_BBOX = new NehubaVCtxToBbox()

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

function sortParc(parcs: SxplrParcellation[]) {
  const hasPrev = parcs.filter(p => !!p.prevId)
  const hasNoPrev = parcs.filter(p => !p.prevId)
  
  const returnHasPrev: SxplrParcellation[] = []
  let FUSE = 10

  while (hasPrev.length > 0){
    FUSE -= 1
    if (FUSE < 0) {
      console.error(`fuse broke`)
      break
    }
    const prevIds = new Set(hasPrev.map(p => p.prevId))
    const idx = hasPrev.findIndex(p => !prevIds.has(p.id))
    if (idx < 0) {
      // reaches the end usually
      break
    }
    returnHasPrev.push(
      ...hasPrev.splice(idx, 1)
    )
  }
  return [
    ...returnHasPrev,
    ...hasPrev,
    ...hasNoPrev,
  ]
}

const SPATIAL_TRANSFORM_SRC = "SPATIAL_TRANSFORM_SRC"
const SPATIAL_TRANSFORM_RESULT = "SPATIAL_TRANSFORM_RESULT"
const CORTICAL_LAYERS_WARNING = "CORTICAL_LAYERS_WARNING"
const REGION_DESELECTED_WARNING = "REGION_DESELECTED_WARNING"

type TPSelectPostHookOptions = {
  [SPATIAL_TRANSFORM_SRC]?: number[]
  [SPATIAL_TRANSFORM_RESULT]?: "failed" | "succeeded"
  [CORTICAL_LAYERS_WARNING]?: string
  [REGION_DESELECTED_WARNING]?: string
}

type TPSelectPostHook = Partial<AtlasSelectionState> & { options?: TPSelectPostHookOptions }

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

  /**
   * @description a list of hooks to be called in list order after parcellation and template selection. 
   * The hooks are called in parallel and the results are applied - and potentially overwritten - in the order of the list.
   */
  onTemplateParcSelectionPostHook: ((arg: OnTmplParcHookArg) => Observable<TPSelectPostHook>)[] = [
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
           * else if space name is the same, skip trying to transform
           */
          !prevSpcName || !currSpcName || prevSpcName === currSpcName
          ? of({ navigation })
          : this.interSpaceCoordXformSvc.transform(prevSpcName, currSpcName, navigation.position as [number, number, number]).pipe(
            map(value => {
              const common: TPSelectPostHookOptions = {
                [SPATIAL_TRANSFORM_SRC]: navigation.position
              }
              if (value.status === "error") {
                return {
                  navigation: null,
                  options: {
                    [SPATIAL_TRANSFORM_RESULT]: 'failed',
                    ...common,
                  }
                } as TPSelectPostHook
              }
              return {
                navigation: {
                  ...navigation,
                  position: value.result,
                },
                options: {
                  SPATIAL_TRANSFORM_RESULT: 'succeeded',
                  ...common,
                }
              } as TPSelectPostHook
            })
          )
        )
      )
    },
    ({ current, previous }) => {
      const prevParcId = previous?.parcellation?.id
      const currentParcId = current?.parcellation?.id
      const options: Record<string, string> = {}
      if (currentParcId !== prevParcId && currentParcId === IDS.PARCELLATION.CORTICAL_LAYERS) {
        options[CORTICAL_LAYERS_WARNING] = "Regional inaccuracies in the automated computation of cortical layers may occur due to limitations in the available training data and algorithm. Regions that deviate from the expected canonical isocortical structure should be examined with caution."
      }
      return of({ options })
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
        atlasAppearance.actions.removeCustomLayers({
          customLayers: layers
        }),
        atlasAppearance.actions.addCustomLayers({
          customLayers: [{
            clType: "baselayer/colormap",
            id: 'base-colormap-id',
            colormap: map
          }]
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
            console.log(`Error: ${errMessage}`)
            return throwError(errMessage)
          }

          /**
           * narrow down the valid atlas, template and parcellation according to the current state
           * If intersection is None, then leave the possibility intact
           */
          const foundAtlas = atlas && result.atlases.find(a => a.id === atlas.id)
          const foundParc = parcellation && result.parcellations.find(a => a.id === parcellation.id)
          const foundSpace = template && result.spaces.find(a => a.id === template.id)

          const parcInSameColl = !!parcellation?.collection
          ? result.parcellations.filter(p => p.collection === parcellation.collection)
          : []
          const sortedParcInSameColl = sortParc(parcInSameColl)
          
          result.atlases = foundAtlas && [foundAtlas] || result.atlases
          result.parcellations = foundParc && [foundParc] || sortedParcInSameColl[0] && [sortedParcInSameColl[0]] || result.parcellations
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
                  let talliedOptions: TPSelectPostHookOptions = {}
                  for (const partial of partialState){
                    const { options, ...rest } = partial
                    state = {
                      ...state,
                      ...rest,
                    }
                    talliedOptions = {
                      ...talliedOptions,
                      ...options,
                    }
                  }

                  state.selectedRegions = []
                  if (!!regionId) {
                    const selectedRegions = (state.selectedParcellationAllRegions || []).filter(r => r.name === regionId)
                    if (selectedRegions.length === 0) {
                      talliedOptions[REGION_DESELECTED_WARNING] = regionId
                    }
                    state.selectedRegions = selectedRegions
                  }

                  const warningMarkdowns = []
                  if (talliedOptions[SPATIAL_TRANSFORM_SRC] && talliedOptions[SPATIAL_TRANSFORM_RESULT]) {
                    let text = `Due to the change of reference space, previous navigation location ${talliedOptions[SPATIAL_TRANSFORM_SRC].map(v => (v/1e6).toFixed(2) + "mm").join(", ")} in ${template.name} `
                    if (talliedOptions[SPATIAL_TRANSFORM_RESULT] === "succeeded") {
                      text += `was warped to ${(state?.navigation?.position || [0, 0, 0]).map(v => (v/1e6).toFixed(2) + "mm").join(", ")} in ${state?.selectedTemplate?.name}`
                    } else {
                      text += `was attempted to be warped to ${state?.selectedTemplate?.name}, but was unsuccessful. The navigation was reset to 0, 0, 0`
                    }
                    warningMarkdowns.push(text)
                  }
                  if (talliedOptions[CORTICAL_LAYERS_WARNING]) {
                    warningMarkdowns.push(talliedOptions[CORTICAL_LAYERS_WARNING])
                  }
                  if (talliedOptions[REGION_DESELECTED_WARNING]) {
                    warningMarkdowns.push(`Due to the change of reference parcellation, previously selected region ${talliedOptions[REGION_DESELECTED_WARNING]} is not available. Therefore, region selection has been reset.`)
                  }
                  if (warningMarkdowns.length > 0) {
                    this.sxplrSnackBarSvc.open({
                      message: warningMarkdowns.join(`\n\n---\n\n`),
                      useMarkdown: true,
                      icon: "fas fa-info"
                    })
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
    switchMap(([{ region: _region, timeout: _timeout }, selectedTemplate, selectedAtlas, selectedParcellation]) => {
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
        timeout(!!_timeout ?  _timeout : Number.MAX_SAFE_INTEGER),
        catchError(err => {
          if (err instanceof TimeoutError) {
            return of(
              mainActions.generalActionError({
                message: `Took longer than ${_timeout}ms. Stopping early.`
              })
            )
          }
          return of(
            mainActions.generalActionError({
              message: `getting region detail error! cannot get coordinates`
            })
          )
        }),
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

  onViewportChanges = createEffect(() => this.store.pipe(
    select(atlasAppearance.selectors.useViewer),
    distinctUntilChanged(),
    switchMap(useViewer => {
      if (useViewer !== "NEHUBA") {
        return of(generalActions.noop())
      }
      return this.store.pipe(
        select(selectors.selectedTemplate),
        switchMap(selectedTemplate => combineLatest([
          concat(
            of(null),
            this.resize.windowResize,
          ),
          this.ctxMenuSvc.context$
        ]).pipe(
          debounceTime(160),
          map(([_, ctx]) => {
            
            const { width, height } = window.screen

            /**
             * Usually, viewers are in 4 panel view, so half it
             */
            const size = Math.max(width, height) / 2
          
            const result = NEHUBA_CTX_BBOX.transform(ctx, [size, size, size])
            if (!result) {
              return generalActions.noop()
            }
            const [ min, max ] = result
            return actions.setViewport({
              viewport: {
                spaceId: selectedTemplate.id,
                space: selectedTemplate,
                minpoint: min,
                maxpoint: max,
                center: min.map((v, idx) => (v + max[idx])/2) as [number, number, number]
              }
            })
          })          
        ))
      )
    })
  ))

  onRegionSelectionNavigateToCentroid = createEffect(() => this.action.pipe(
    ofType(actions.selectRegion),
    map(({ region }) => {
      
      if (region) {
        this.onNavigateToRegion.pipe(
          take(1)
        ).subscribe(() => {
          this.sxplrOverlaySvc.close()
        })

        const injector = Injector.create({
          providers: [
            {
              provide: REGION_LOADING_TOKEN,
              useValue: { region } as RegionLoadingCfg
            }
          ]
        })
        const portal = new ComponentPortal(LoadingRegionCmp, null, injector)
        this.sxplrOverlaySvc.openPortal(portal)
        this.store.dispatch(
          actions.navigateToRegion({ region, timeout: REGION_LOADING_TIMEOUT })
        )
      }
    })
  ), { dispatch: false })

  constructor(
    private action: Actions,
    private sapiSvc: SAPI,
    private store: Store,
    private interSpaceCoordXformSvc: InterSpaceCoordXformSvc,
    private collapser: DecisionCollapse,
    private dialog: MatDialog,
    private resize: ResizeObserverService,
    private sxplrSnackBarSvc: SxplrSnackBarSvc,
    private sxplrOverlaySvc: SxplrOverlaySvc,
    /** potential issue with circular import. generic should not import specific */
    private ctxMenuSvc: ContextMenuService<TViewerEvtCtxData<'threeSurfer' | 'nehuba'>>,
  ){
  }
}

const REGION_LOADING_TIMEOUT = 3000 // 3sec timeout

type RegionLoadingCfg = { region: SxplrRegion }

const REGION_LOADING_TOKEN = new InjectionToken<RegionLoadingCfg>("REGION_LOADING_TOKEN", {
  factory: () => ({ region: null })
})

@Component({
  selector: 'sxplr-apple',
  template: `
<div class="sxplr-custom-cmp text">
  <mat-spinner></mat-spinner>
  <ng-template [ngIf]="regionLoadingCfg?.region" let-region>
    Loading region {{ region.name }}
  </ng-template>
</div>
`,
  styles: [
    `:host > div{ display: flex; flex-direction: column; align-items: center; }`
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule
  ]
})

class LoadingRegionCmp {
  constructor(
    @Inject(REGION_LOADING_TOKEN)
    public regionLoadingCfg: RegionLoadingCfg
  ){

  }
}