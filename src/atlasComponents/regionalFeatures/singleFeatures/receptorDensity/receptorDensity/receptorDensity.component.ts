import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, Optional } from "@angular/core";
import { fromEvent, Observable, of, Subscription } from "rxjs";
import { RegionalFeaturesService } from "src/atlasComponents/regionalFeatures/regionalFeature.service";
import { PureContantService } from "src/util";
import { RegionFeatureBase } from "../../base/regionFeature.base";
import { ISingleFeature } from "../../interfaces";
import { CONST } from 'common/constants'

const {
  RECEPTOR_FP_CAPTION,
  RECEPTOR_PR_CAPTION,
  RECEPTOR_AR_CAPTION,
} = CONST
@Component({
  templateUrl: './receptorDensity.template.html',
  styleUrls: [
    './receptorDensity.style.css'
  ]
})

export class ReceptorDensityFeatureCmp extends RegionFeatureBase implements ISingleFeature, OnDestroy{

  public RECEPTOR_FP_CAPTION = RECEPTOR_FP_CAPTION
  public RECEPTOR_PR_CAPTION = RECEPTOR_PR_CAPTION
  public RECEPTOR_AR_CAPTION = RECEPTOR_AR_CAPTION

  public DS_PREVIEW_URL = DATASET_PREVIEW_URL
  viewChanged: EventEmitter<null> = new EventEmitter()

  private WEB_COMPONENT_MOUSEOVER_EVENT_NAME = 'kg-ds-prv-regional-feature-mouseover'
  private webComponentOnHover: string = null

  public selectedReceptor: string

  public darktheme$: Observable<boolean>

  private subs: Subscription[] = []
  public depScriptLoaded$: Observable<boolean>
  constructor(
    regService: RegionalFeaturesService,
    el: ElementRef,
    @Optional() pureConstantService: PureContantService
  ){
    super(regService)
    this.depScriptLoaded$ = regService.depScriptLoaded$
    if (pureConstantService) {
      this.darktheme$ = pureConstantService.darktheme$
    } else {
      this.darktheme$ = of(false)
    }

    this.subs.push(
      fromEvent(el.nativeElement, this.WEB_COMPONENT_MOUSEOVER_EVENT_NAME).subscribe((ev: CustomEvent) => {
        this.webComponentOnHover = ev.detail?.data?.receptor?.label
      })
    )
  }

  @HostListener('click')
  onClick(){
    if (this.webComponentOnHover) {
      this.selectedReceptor = this.webComponentOnHover
    }
  }

  ngOnDestroy(){
    while(this.subs.length > 0) this.subs.pop().unsubscribe()
  }
}
