import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { SAPI } from "../sapi";
import { select, Store } from "@ngrx/store";
import { atlasAppearance, atlasSelection, StateModule } from "src/state";
import { combineLatest, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { AngularMaterialModule } from "src/sharedModules";
import { AvailableATPDirective } from "../sapi/core/availableATP.directive";
import { GroupedParcellation, SapiViewsCoreParcellationModule } from "../sapiViews/core/parcellation";
import { SxplrParcellation, SxplrRegion } from "../sapi/sxplrTypes";
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
import { FindCmp } from "src/ui/find/find.component";
import { AnnotateCmp } from "src/ui/annotate/annotate.component";
import { PluginModule } from "src/plugin";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { ScreenshotModule } from "src/screenshot";

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
    FindCmp,
    AnnotateCmp,
    StateModule,
    PluginModule,
    ExperimentalFlagDirective,
    ScreenshotModule,
  ],
  hostDirectives: [
    AvailableATPDirective,
  ]
})

export class StatusbarCmp {

  @Input()
  halfmode: "top" | "bottom" = "bottom"

  #atpDir = inject(AvailableATPDirective)

  DoiTemplate = DoiTemplate

  constructor(private store: Store, private sapi: SAPI) {

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
      {selectedATP, templates, parcellations, atlases, noGroupParcs, groupParcs},
      { parcellationVisible },
      { position },
      { allAvailableRegions, labelMappedRegionNames, leafRegions, branchRegions },
      selectedRegions,
    ]) => {
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
      }
    })
  )
  
  public toggleParcellationVisibility(){
    this.store.dispatch(
      atlasAppearance.actions.toggleParcDelineation()
    )
  }
  
  public async selectATP(type: 'atlasId' | 'parcellationId' | 'templateId', id: string, regionId?: string) {
    return await this.#atpDir.selectATP(type, id, regionId)
  }

  gotoNewestParc(){
    this.store.dispatch(
      atlasSelection.actions.gotoNewestParc()
    )
  }

  getSubParcellation(obj: GroupedParcellation): SxplrParcellation[] {
    return obj.parcellations
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
