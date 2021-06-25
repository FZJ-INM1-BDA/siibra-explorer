import { Component, Input, OnChanges } from "@angular/core";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { KG_REGIONAL_FEATURE_KEY, TBSDetail, UNDER_REVIEW } from "../type";
import { ARIA_LABELS, CONST } from 'common/constants'
import { TBSSummary } from "../../kgDataset";
import { BsFeatureService } from "../../service";

/**
 * this component is specifically used to render side panel ebrains dataset view
 */

@Component({
  selector: 'kg-regional-feature-detail',
  templateUrl: './kgRegDetail.template.html',
  styleUrls: [
    './kgRegDetail.style.css'
  ]
})

export class KgRegDetailCmp extends BsRegionInputBase implements OnChanges {

  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  @Input()
  public summary: TBSSummary

  @Input()
  public detail: TBSDetail

  public loadingFlag = false
  public error = null

  public nameFallback = `[This dataset cannot be fetched right now]`
  public isGdprProtected = false

  public descriptionFallback = `[This dataset cannot be fetched right now]`

  constructor(svc: BsFeatureService){
    super(svc)
  }

  ngOnChanges(){
    if (!this.region) return
    if (!this.summary) return
    if (!!this.detail) return
    this.loadingFlag = true
    this.getFeatureInstance(KG_REGIONAL_FEATURE_KEY, this.summary['@id']).subscribe(
      detail => {
        this.detail = detail
        this.isGdprProtected = detail.__detail.embargoStatus && detail.__detail.embargoStatus.some(status => status["@id"] === UNDER_REVIEW["@id"])
      },
      err => {
        this.error = err.toString()
      },
      () => {
        this.loadingFlag = false
      }
    )
  }
}
