import {
  AfterViewInit,
  Component,
  EventEmitter,
  Inject,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from "@angular/core";
import { Observable, Subject } from "rxjs";
import { DARKTHEME } from "src/util/injectionTokens";
import { SapiViewsCoreRegionRegionBase } from "../region.base.directive";
import { ARIA_LABELS, CONST } from 'common/constants'
import { SapiRegionalFeatureModel } from "src/atlasComponents/sapi";
import {MatExpansionPanel} from "@angular/material/expansion";

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

  public expandedPanel: string

  constructor(
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>
  ){
    super()
  }

  handleRegionalFeatureClicked(feat: SapiRegionalFeatureModel) {
    this.featureClicked.emit(feat)
  }

  handleExpansionPanelClosedEv(title: string){
    this.expandedPanel = ''
    console.log("title", title)
  }

  handleExpansionPanelAfterExpandEv(title: string) {
    this.expandedPanel = title
    console.log("title", title)
  }

  activePanelTitles$: Observable<string[]> = new Subject()

}
