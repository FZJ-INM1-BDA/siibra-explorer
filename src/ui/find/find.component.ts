import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, of } from "rxjs";
import { map } from "rxjs/operators";
import { AnnotationDirective } from "src/atlasComponents/annotations/annotation.directive";
import { IDS } from "src/atlasComponents/sapi";
import { AvailableATPDirective } from "src/atlasComponents/sapi/core/availableATP.directive";
import { Feature, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { SapiViewsUtilModule } from "src/atlasComponents/sapiViews";
import { SapiViewsCoreSpaceModule } from "src/atlasComponents/sapiViews/core/space";
import { FeatureModule } from "src/features";
import { TPBRViewCmp } from "src/features/TPBRView/TPBRView.component";
import { AngularMaterialModule } from "src/sharedModules";
import { atlasSelection, userInteraction, userPreference } from "src/state";
import { UtilModule } from "src/util";
import { getUuid } from "src/util/fn";
import { MM_ID, QV_T, SANDS_TYPE } from "src/util/types";
import { DialogModule } from "../dialogInfo";
import { NeighbourOverlay } from "src/components/neighbourOverlay/neighbourOverlay.component";
import { enLabels } from "src/uiLabels";
import { SapiViewsCoreRegionModule } from "src/atlasComponents/sapiViews/core/region";
import { BANLIST_CONNECTIVITY, EXPERIMENTAL_CONNECTIVITY, WHITELIST_CONNECTIVITY } from "src/features/connectivity";
import { ViewerMode } from "src/state/atlasSelection/const";
import { SxplrDumbFeatureList } from "src/features/dumbList/dumbList.component";
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";

@Component({
  selector: 'sxplr-find',
  templateUrl: './find.template.html',
  styleUrls: [
    './find.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsUtilModule,
    FeatureModule,
    UtilModule,
    SapiViewsCoreSpaceModule,
    AnnotationDirective,
    TPBRViewCmp,
    DialogModule,
    NeighbourOverlay,
    SapiViewsCoreRegionModule,
    SxplrDumbFeatureList,
    MediaQueryDirective,
    ExperimentalFlagDirective,
    
  ],
  hostDirectives: [
    AvailableATPDirective,
  ]
})

export class FindCmp{
  #atpDirective = inject(AvailableATPDirective)

  #spaceStates$ = combineLatest([
    this.store$.pipe(
      select(atlasSelection.selectors.currentViewport)
    )
  ]).pipe(
    map(([ currentViewport ]) => {
      return {
        currentViewport
      }
    })
  )

  #selectedRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )

  #experimental$ = this.store$.pipe(
    select(userPreference.selectors.showExperimental)
  )

  constructor(private store$: Store){

  }

  view$ = combineLatest([
    of(enLabels),
    this.#spaceStates$,
    this.#atpDirective.view$,
    this.#selectedRegions$,
    this.#experimental$,
  ]).pipe(
    map(([ labels,  { currentViewport }, { selectedATP }, selectedRegions, showExperimental ]) => {
      const { template, atlas, parcellation } = selectedATP
      const isVolumetric = template && template.id !== IDS.TEMPLATES.FSAVERAGE

      const enableRegionalConnectivity = (
        WHITELIST_CONNECTIVITY.SPECIES.includes(atlas?.species)
        && !BANLIST_CONNECTIVITY.SPECIES.includes(atlas?.species)
        && selectedRegions.length === 1
        && (
          (
            WHITELIST_CONNECTIVITY.SPACE.includes(template?.id) && !BANLIST_CONNECTIVITY.SPACE.includes(template?.id)
          ) || (
            WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id) && !BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          )
        )
        && (
          (
            WHITELIST_CONNECTIVITY.SPACE.includes(template?.id) && !BANLIST_CONNECTIVITY.SPACE.includes(template?.id)
          ) || (
            WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id) && !BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          ) || (
            showExperimental && EXPERIMENTAL_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          )
        )
      )
      return {
        labels,
        selectedATP,
        currentViewport,
        isVolumetric,
        selectedRegions,
        enableRegionalConnectivity,
      }
    })
  )

  public assignPoint(position: number[], template: SxplrTemplate) {
    this.store$.dispatch(
      atlasSelection.actions.selectPoint({
        point: {
          "@type": SANDS_TYPE,
          "@id": getUuid(),
          coordinateSpace: {
            "@id": template.id
          },
          coordinates: position.map(v => ({
            "@id": getUuid(),
            "@type": QV_T,
            unit: {
              "@id": MM_ID,
            },
            value: v * 1e6,
            uncertainty: [0, 0]
          }))
        }
      })
    )
  }
  /**
   * Navigate to position (in mm)
   */
  public navigateTo(position: number[]){
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          position: position.map(v => v * 1e6),
        },
        animation: true,
        physical: true
      })
    )
  }
  
  public async selectATP(type: 'atlasId' | 'parcellationId' | 'templateId', id: string, regionId?: string) {
    return await this.#atpDirective.selectATP(type, id, regionId)
  }

  public goToViewerMode(viewerMode: ViewerMode){
    this.store$.dispatch(
      atlasSelection.actions.setViewerMode({
        viewerMode
      })
    )
  }

  public selectFeature(feature: Feature){
    this.store$.dispatch(
      userInteraction.actions.showFeature({
        feature
      })
    )
  }
}
