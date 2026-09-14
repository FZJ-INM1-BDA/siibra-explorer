import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { AtlasDownloadModule } from "src/atlas-download/atlas-download.module";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { FeatureModule } from "src/features";
import { FeatureCombinedViewCmp } from "src/features/combinedView/combinedView.component";

import { PluginModule } from "src/plugin";
import { ScreenshotModule } from "src/screenshot";
import { ShareModule } from "src/share";
import { AngularMaterialModule } from "src/sharedModules";
import { atlasSelection, StateModule, userInteraction } from "src/state";
import { fromRootStore } from "src/state/atlasSelection";
import { AnnotateCmp } from "src/ui/annotate/annotate.component";
import { DialogModule } from "src/ui/dialogInfo";
import { StopPropagationSADirective } from "src/util/directives/stopPropagation.standalone.directive";
import { SwitchDirective } from "src/util/directives/switch.directive";
import { ToolbarWidgetHost } from "../toolbarWidget/toolbarWidgetHost.directive";
import { KeyFrameModule } from "src/keyframesModule/module";

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
    FeatureCombinedViewCmp,
    AnnotateCmp,
    ScreenshotModule,
    AtlasDownloadModule,
    StopPropagationSADirective,
    FeatureModule,
    ToolbarWidgetHost,
    KeyFrameModule,
  ],
})

export class ToolbarCmp {
  view$ = combineLatest([
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
      select(userInteraction.selectors.selectedFeature)
    ),
    this.store.pipe(
      select(atlasSelection.selectors.viewerMode)
    )
  ]).pipe(
    map(([ ATP, selectedRegions, currentViewport, selectedFeature, viewerMode ]) => {
      return {
        selectedAtlas: ATP?.atlas,
        selectedTemplate: ATP?.template,
        selectedParcellation: ATP?.parcellation,
        selectedRegions: selectedRegions,
        currentViewport,
        selectedFeature,
        viewerMode,
      }
    }),
    shareReplay(1),
  )

  constructor(private store: Store){

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