import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { SAPI } from "../sapi";
import { select, Store } from "@ngrx/store";
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { combineLatest, of } from "rxjs";
import { map, switchMap, take, takeUntil } from "rxjs/operators";
import { AngularMaterialModule } from "src/sharedModules";
import { AvailableATPDirective } from "../sapi/core/availableATP.directive";
import { GroupedParcellation, SapiViewsCoreParcellationModule } from "../sapiViews/core/parcellation";
import { Feature, SxplrMap, SxplrParcellation, SxplrRegion } from "../sapi/sxplrTypes";
import { DoiTemplate } from "src/ui/doi/doi.component";
import { DialogModule } from "src/ui/dialogInfo";
import { UtilModule } from "src/util";
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive";
import { NavigationInput } from "../navigationInputs/navigationInputs.component";
import { TopMenuModule } from "src/ui/topMenu/module";
import { enLabels } from "src/uiLabels";
import { SapiViewsCoreRichModule } from "../sapiViews/core/rich/module";
import { SapiViewsCoreRegionModule } from "../sapiViews/core/region";
import { SapiViewsUtilModule } from "../sapiViews";
import { ShareModule } from "src/share";
import { ScreenshotModule } from "src/screenshot";
import { AllVersionsParcs } from "../sapiViews/core/parcellation/allVersions.pipe";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { OnlyShowNewestParc } from "../sapiViews/core/parcellation/onlyShowNewest.pipe";
import { AtlasViewerRouterModule } from "src/routerModule";
import { FlashDirective } from "src/util/directives/flash.directive";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { AtlasMapReducerXform, CurrentAtlasMapReduceXform, FeatureCategoryBanFilePipe, FilterMapGrpPipe, GatherMapGrpClassifersPipe, MapGridReducerPipe, MapToSpacesPipe, ReducedMapGroup } from "./mapReducer.pipe";
import { DatasetAggregator } from "src/features/datasetAggregator.directive";
import { FeatureModule } from "src/features";
import { ListDirective } from "src/features/list/list.directive";

const allVersionsPipe = new AllVersionsParcs()
const onlyShowNewestPipe = new OnlyShowNewestParc()

@Component({
  selector: 'sxplr-status-bar',
  templateUrl: "./statusbar.template.html",
  styleUrls: [
    "./statusbar.style.scss"
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsCoreParcellationModule,
    DialogModule,
    UtilModule,
    MediaQueryDirective,
    NavigationInput,
    TopMenuModule,
    SapiViewsCoreRichModule,
    SapiViewsCoreRegionModule,
    SapiViewsUtilModule,
    ShareModule,
    ScreenshotModule,
    AtlasViewerRouterModule,
    FlashDirective,
    ExperimentalFlagDirective,
    AtlasMapReducerXform,
    CurrentAtlasMapReduceXform,
    GatherMapGrpClassifersPipe,
    MapGridReducerPipe,
    MapToSpacesPipe,
    DatasetAggregator,
    FeatureModule,
    FeatureCategoryBanFilePipe,
],
  hostDirectives: [
    AvailableATPDirective,
    DestroyDirective,
  ]
})

export class StatusbarCmp {

  asReducedMapGroup(input: unknown): input is ReducedMapGroup{
    return (input as any)?.['type'] === "reducedMapGrp"
  }

  asAny(input: unknown): input is any {
    return true
  }

  datasetDialogExtract(input: any): ListDirective | undefined | null{
    const {listDir} = input
    if (listDir instanceof ListDirective) {
      listDir.datasource$.subscribe()
      return listDir
    }
    return null
  }

  regionsToRegionNames(regions: SxplrRegion[]): string[]{
    return regions.map(r => r.name)
  }

  #atpDir = inject(AvailableATPDirective)
  #ondestroy$ = inject(DestroyDirective).destroyed$

  DoiTemplate = DoiTemplate

  allParcVersions: SxplrParcellation[] = []
  currParcVerIdx: number = -1

  constructor(private store: Store, private sapi: SAPI) {
    this.view$.pipe(
      takeUntil(this.#ondestroy$)
    ).subscribe(v => {
      this.allParcVersions = v.allParcVersions
      this.currParcVerIdx = v.allParcVersions.findIndex(p => p.id === v?.selectedATP?.parcellation?.id)
    })
  }

  #atlasAppearance$ = combineLatest([
    this.store.pipe(
      select(atlasAppearance.selectors.showDelineation),
    ),
  ]).pipe(
    map(([parcellationVisible]) => {
      return { parcellationVisible }
    })
  )

  #atlasSelection$ = combineLatest([
    this.store.pipe(
      select(atlasSelection.selectors.navigation)
    )
  ]).pipe(
    map(([ navigation ]) => {
      return { 
        position: navigation?.position || [0, 0, 0]
       }
    })
  )

  #parcStates$ = combineLatest([
    this.store.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions)
    ),
    // current labelled map
    this.#atpDir.view$.pipe(
      switchMap(
        ({ selectedATP: { template, parcellation } }) => template && parcellation
        ? this.sapi.getLabelledMap(parcellation, template)
        : of(null)
      )
    )
  ]).pipe(
    map(([ allAvailableRegions, currentMap ]) => {
      const labelMappedRegionNames = currentMap && Object.keys(currentMap.indices) || []
      const parentIds = new Set(allAvailableRegions.flatMap(v => v.parentIds))
      return {
        allAvailableRegions,
        labelMappedRegionNames,
        leafRegions: allAvailableRegions.filter(r => !parentIds.has(r.id)),
        branchRegions: allAvailableRegions.filter(r => parentIds.has(r.id)),
      }
    })
  )
  
  #selectedRegions$ = this.store.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )

  view$ = combineLatest([
    of(enLabels),
    this.#atpDir.view$,
    this.#atlasAppearance$,
    this.#atlasSelection$,
    this.#parcStates$,
    this.#selectedRegions$,
  ]).pipe(
    map(([
      labels,
      {selectedATP, templates, parcellations, atlases, noGroupParcs, groupParcs, maps, mapAggregations},
      { parcellationVisible },
      { position },
      { allAvailableRegions, labelMappedRegionNames, leafRegions, branchRegions },
      selectedRegions,
    ]) => {
      const allParcVersions = allVersionsPipe.transform(selectedATP.parcellation, parcellations)
      const suitableMaps = maps.filter(m => 
        m.parcellationId === selectedATP.parcellation.id
        && m.spaceId === selectedATP.template.id
      )
      const statMap = suitableMaps.find(m => m.type === "STATISTICAL")
      const selectedMap = statMap && selectedRegions.length === 1
      ? statMap
      : suitableMaps.find(m => m.type === "LABELLED")

      const availableMaps = maps.filter(m => m.aggregation?.id === selectedMap?.aggregation?.id)
      return {
        labels,
        selectedATP,
        noGroupParcs, groupParcs,
        parcellationVisible,
        templates, parcellations, atlases,
        position, positionMm: position.map(v => v / 1e6),
        allAvailableRegions,
        labelMappedRegionNames,
        selectedRegions,
        leafRegions,
        branchRegions,
        allParcVersions,
        parcIsVersioned: allParcVersions.length > 0,
        maps,
        selectedMap,
        availableMaps,
        aggregatedMap: mapAggregations,
        selectedAggregatedMap: selectedMap?.aggregation
      }
    })
  )
  
  public toggleParcellationVisibility(){
    this.store.dispatch(
      atlasAppearance.actions.toggleParcDelineation()
    )
  }
  
  public async selectATP(type: 'atlasId' | 'parcellationId' | 'templateId', id: string, regionIds: string[]=[]) {
    if (!["atlasId", "parcellationId", "templateId"].includes(type)) {
      this.selectSome(type, id as any, regionIds)
      return
    }
    return await this.#atpDir.selectATP(type, id, regionIds && regionIds[0])
  }

  public async selectSome(type: string, value: (SxplrMap[] | string | ListDirective), regionIds: string[] = []){
    switch (type) {
      case "maps": {
        const maps = value as SxplrMap[]
        const parcIdSet = new Set(maps.map(m => m.parcellationId))
        if (parcIdSet.size === 0) {
          console.error(`${maps} had no parcId. aborting`)
          return
        }
        if (parcIdSet.size > 1) {
          console.warn(`${parcIdSet} has more than 1 entry, using first one`)
        }
        const parcId = Array.from(parcIdSet)[0]
        this.store.dispatch(
          atlasSelection.actions.selectATPById({
            parcellationId: parcId,
            regionId: regionIds && regionIds[0],
            config: {
              autoSelect: true
            }
          })
        )
        return
      }
      case "newatlas": {
        const aggreId = value as string
        const result = await this.view$.pipe(
          take(1)
        ).toPromise()
        const foundMap = result.maps.find(m => m.aggregation?.id === aggreId)
        if (!foundMap) {
          console.error(`Cannot find aggregation with id ${aggreId}`)
          return
        }
        this.store.dispatch(
          atlasSelection.actions.selectATPById({
            parcellationId: foundMap.parcellationId,
            config: {
              autoSelect: true
            }
          })
        )
        return
      }
      case "features": {
        const listdir = value as ListDirective
        break
      }
      default: {
        console.error(`type ${type} cannot be processed`)
      }
    }
  }

  gotoNewestParc(){
    this.store.dispatch(
      atlasSelection.actions.gotoNewestParc()
    )
  }

  getSubParcellation(obj: GroupedParcellation): SxplrParcellation[] {
    return onlyShowNewestPipe.transform(obj.parcellations) 
  }

  selectRoi(roi: SxplrRegion){
    this.store.dispatch(
      atlasSelection.actions.selectRegion({
        region: roi
      })
    )
  }
  
  toggleRoi(roi: SxplrRegion){
    this.store.dispatch(
      atlasSelection.actions.toggleRegion({
        region: roi
      })
    )
  }
  clearRoi(){
    this.store.dispatch(
      atlasSelection.actions.clearSelectedRegions()
    )
  }
  
  /**
   * Navigate to position (in mm)
   */
  public navigateTo(position: number[]){
    this.store.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          position: position.map(v => v * 1e6),
        },
        animation: true,
        physical: true
      })
    )
  }

  formatVersionedParcLabel(idx: number): string{
    if (!this.allParcVersions) {
      return `unkonwn`
    }
    const p = this.allParcVersions[idx]
    if (!p) {
      return `Unknown`
    }
    return p.versionName || p.shortName || p.name
  }
  selectParcVersionIdx(idx: any): void {
    const p = this.allParcVersions[idx]
    if (!p) {
      throw new Error(`${idx} not defined`)
    }
    this.selectATP("parcellationId", p.id)
  }

  selectFeature(feature: Feature){
    this.store.dispatch(
      userInteraction.actions.showFeature({
        feature
      })
    )
  }
  
  #keyListenerConfigBase = {
    type: 'keydown' as const,
    stop: true,
    target: 'document' as const,
  }
  
  public keyListenerConfig = [{
    key: 'h',
    capture: true,
    ...this.#keyListenerConfigBase,
  }, {
    key: 'H',
    capture: true,
    ...this.#keyListenerConfigBase,
  }, {
    key: '?',
    ...this.#keyListenerConfigBase,
  }]
}
