import { CommonModule } from "@angular/common";
import { Component, inject, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest } from "rxjs";
import { filter, map, shareReplay, takeUntil } from "rxjs/operators";
import { AtlasDownloadModule } from "src/atlas-download/atlas-download.module";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { FeatureModule } from "src/features";
import { PluginModule } from "src/plugin";
import { ScreenshotModule } from "src/screenshot";
import { ShareModule } from "src/share";
import { AngularMaterialModule } from "src/sharedModules";
import { atlasAppearance, atlasSelection, StateModule, userInteraction, userPreference } from "src/state";
import { fromRootStore } from "src/state/atlasSelection";
import { AnnotateCmp } from "src/ui/annotate/annotate.component";
import { DialogModule } from "src/ui/dialogInfo";
import { StopPropagationSADirective } from "src/util/directives/stopPropagation.standalone.directive";
import { SwitchDirective } from "src/util/directives/switch.directive";
import { ToolbarWidgetHost } from "../toolbarWidget/toolbarWidgetHost.directive";
import { KeyFrameModule } from "src/keyframesModule/module";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { TPBRViewCmp } from "src/features/TPBRView/TPBRView.component";
import { VolumesModule } from "../sapiViews/volumes/volumes.module";
import { UtilModule } from "src/util";
import { SapiViewsCoreSpaceModule } from "../sapiViews/core/space";
import { BANLIST_CONNECTIVITY, EXPERIMENTAL_CONNECTIVITY, SapiViewsFeatureConnectivityModule, WHITELIST_CONNECTIVITY } from "src/features/connectivity";

@Component({
  selector: 'sxplr-tool-bar',
  templateUrl: './toolbar.template.html',
  styleUrls: [
    './toolbar.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    DialogModule,
    ShareModule,
    PluginModule,
    StateModule,
    ExperimentalFlagDirective,
    SwitchDirective,
    AnnotateCmp,
    ScreenshotModule,
    AtlasDownloadModule,
    StopPropagationSADirective,
    FeatureModule,
    ToolbarWidgetHost,
    KeyFrameModule,
    TPBRViewCmp,
    VolumesModule,
    UtilModule,
    SapiViewsCoreSpaceModule,
    SapiViewsFeatureConnectivityModule,
  ],
  hostDirectives: [
    DestroyDirective
  ]
})

export class ToolbarCmp {
  @ViewChild('searchSwitch')
  findSwitch: SwitchDirective|undefined

  ondestroy$ = inject(DestroyDirective).destroyed$

  #showConnectivity$ = combineLatest([
    this.store.pipe(
      fromRootStore.distinctATP(),
    ),
    this.store.pipe(
      select(atlasSelection.selectors.selectedRegions)
    ),
    this.store.pipe(
      select(userPreference.selectors.showExperimental)
    )
  ]).pipe(
    map(([atp, regions, exmptFlag]) => {
      if (!atp) {
        return false
      }
      const { atlas, parcellation, template } = atp
      const species = atlas?.species
      
      if (!species) {
        return false
      }
      if (!WHITELIST_CONNECTIVITY.SPECIES.includes(species)) {
        return false
      }

      if (regions.length !== 1) {
        return false
      }
      const region = regions

      if (!template || !parcellation || !region) {
        return false
      }
      if (BANLIST_CONNECTIVITY.SPACE.includes(template.id)) {
        return false
      }

      if (BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation.id)) {
        return false
      }

      if (
        WHITELIST_CONNECTIVITY.SPACE.includes(template.id)
        || WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation.id)
      ) {
        return true
      }

      if (
        exmptFlag
        || EXPERIMENTAL_CONNECTIVITY.SPACE.includes(template.id)
        || EXPERIMENTAL_CONNECTIVITY.PARCELLATION.includes(parcellation.id)
      ) {
        return true
      }

      return false
      
    })
  )

  #atlasSelection$ = combineLatest([
    
    this.store.pipe(
      fromRootStore.distinctATP()
    ),
    this.store.pipe(
      select(atlasSelection.selectors.selectedRegions)
    ),
    this.store.pipe(
      select(atlasSelection.selectors.currentViewport)
    ),
    this.store.pipe(
      select(atlasSelection.selectors.viewerMode)
    ),
  ]).pipe(
    map(([ ATP, selectedRegions, currentViewport, viewerMode ]) => {
      return { ATP, selectedRegions, currentViewport, viewerMode }
    }),
    shareReplay(1),
  )

  view$ = combineLatest([
    this.#atlasSelection$,
    this.store.pipe(
      select(userInteraction.selectors.selectedFeature)
    ),
    this.store.pipe(
      select(atlasAppearance.selectors.useViewer)
    ),
    this.#showConnectivity$
  ]).pipe(
    map(([ { ATP, selectedRegions, currentViewport, viewerMode }, selectedFeature, useViewer, showConnectivity ]) => {
      return {
        selectedAtlas: ATP?.atlas,
        selectedTemplate: ATP?.template,
        selectedParcellation: ATP?.parcellation,
        selectedRegions: selectedRegions,
        currentViewport,
        selectedFeature,
        viewerMode,
        useViewer,
        showConnectivity,
      }
    }),
    shareReplay(1),
  )

  constructor(private store: Store){
    this.view$.pipe(
      takeUntil(this.ondestroy$),
      map(v => v.selectedFeature),
      filter(sf => !!sf),
    ).subscribe(() => {
      if (this.findSwitch) {
        this.findSwitch.open()
      }
    })
  }

  clearSelectedFeature(){
    this.store.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

  clearSpecialViewMode(){
    this.store.dispatch(
      atlasSelection.actions.clearViewerMode()
    )
  }
}