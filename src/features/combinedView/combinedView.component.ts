import { Component, Input } from "@angular/core";
import { TPRB } from "../util";
import { BehaviorSubject, combineLatest } from "rxjs";
import { AngularMaterialModule } from "src/sharedModules";
import { CommonModule } from "@angular/common";
import { debounceTime, map } from "rxjs/operators";
import { FeatureModule } from "../module";
import { UtilModule } from "src/util";
import { SapiViewsCoreSpaceModule } from "src/atlasComponents/sapiViews/core/space";
import { VolumesModule } from "src/atlasComponents/sapiViews/volumes/volumes.module";
import { BANLIST_CONNECTIVITY, EXPERIMENTAL_CONNECTIVITY, SapiViewsFeatureConnectivityModule, WHITELIST_CONNECTIVITY } from "../connectivity";
import { SxplrAtlas } from "src/atlasComponents/sapi/sxplrTypes";
import { ExperimentalService } from "src/experimental/experimental.service";
import { TPBRViewCmp } from "../TPBRView/TPBRView.component";

@Component({
  selector: 'feature-combined-view',
  templateUrl: './combinedView.template.html',
  styleUrls: [
    './combinedView.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FeatureModule,
    UtilModule,
    SapiViewsCoreSpaceModule,
    VolumesModule,
    SapiViewsFeatureConnectivityModule,
    TPBRViewCmp,
  ]
})

export class FeatureCombinedViewCmp {

  @Input()
  atlas: SxplrAtlas | null = null

  #tprb = new BehaviorSubject<TPRB | null>(null)

  @Input()
  set tprb(tprb: TPRB) {
    this.#tprb.next(tprb)
  }

  tprb$ = this.#tprb.pipe(
    debounceTime(1000),
  )

  showConnectivity$ = combineLatest([
    this.#tprb,
    this.exmptSvc.showExperimentalFlag$,
  ]).pipe(
    map(([v, exmptFlag]) => {
      if (!v) {
        return false
      }

      const species = this.atlas?.species
      if (!species) {
        return false
      }
      if (!WHITELIST_CONNECTIVITY.SPECIES.includes(species)) {
        return false
      }

      const { template, parcellation, region } = v

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

  view$ = combineLatest([
    this.tprb$,
    this.showConnectivity$,
  ]).pipe(
    map(([ tprb, showConnectivity ]) => {
      return {
        ...tprb,
        showConnectivity,
      }
    })
  )

  constructor(private exmptSvc: ExperimentalService) {

  }
}