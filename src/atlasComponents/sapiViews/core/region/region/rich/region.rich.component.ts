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
import { Observable, Subject, Subscription } from "rxjs";
import { filter } from "rxjs/operators"
import { DARKTHEME } from "src/util/injectionTokens";
import { SapiViewsCoreRegionRegionBase } from "../region.base.directive";
import { ARIA_LABELS, CONST } from 'common/constants'
import { SapiRegionalFeatureModel } from "src/atlasComponents/sapi";
import {MatExpansionPanel} from "@angular/material/expansion";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";

@Component({
  selector: 'sxplr-sapiviews-core-region-region-rich',
  templateUrl: './region.rich.template.html',
  styleUrls: [
    `./region.rich.style.css`
  ]
})

export class SapiViewsCoreRegionRegionRich extends SapiViewsCoreRegionRegionBase {
  
  shouldFetchDetail = true
  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  @Output('sxplr-sapiviews-core-region-region-rich-feature-clicked')
  featureClicked = new EventEmitter<SapiRegionalFeatureModel>()

  public expandedPanel: string

  constructor(
    sapi: SAPI,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,
  ){
    super(sapi)
  }

  handleRegionalFeatureClicked(feat: SapiRegionalFeatureModel) {
    this.featureClicked.emit(feat)
  }

  handleExpansionPanelClosedEv(title: string){
    this.expandedPanel = ''
  }

  handleExpansionPanelAfterExpandEv(title: string) {
    this.expandedPanel = title
  }

  activePanelTitles$: Observable<string[]> = new Subject()

}
