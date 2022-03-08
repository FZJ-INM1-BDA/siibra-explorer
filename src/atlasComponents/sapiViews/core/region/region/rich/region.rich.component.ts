import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { DARKTHEME } from "src/util/injectionTokens";
import { SapiViewsCoreRegionRegionBase } from "../region.base.directive";
import { ARIA_LABELS, CONST } from 'common/constants'
import { SapiRegionalFeatureModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'sxplr-sapiviews-core-region-region-rich',
  templateUrl: './region.rich.template.html',
  styleUrls: [
    `./region.rich.style.css`
  ]
})

export class SapiViewsCoreRegionRegionRich extends SapiViewsCoreRegionRegionBase{
  
  get ARIA_LABELS() {
    return ARIA_LABELS
  }

  get CONST() {
    return CONST
  }

  @Output('sxplr-sapiviews-core-region-region-rich-feature-clicked')
  featureClicked = new EventEmitter<SapiRegionalFeatureModel>()

  constructor(
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>
  ){
    super()
  }

  handleRegionalFeatureClicked(feat: SapiRegionalFeatureModel) {
    this.featureClicked.emit(feat)
  }

  handleExpansionPanelClosedEv(title: string){
    console.log("title", title)
  }

  handleExpansionPanelAfterExpandEv(title: string) {
    console.log("title", title)
  }

  activePanelTitles$: Observable<string[]> = new Subject()

}
