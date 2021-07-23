import { Component, Inject, Input, OnChanges, Optional } from "@angular/core";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { KG_REGIONAL_FEATURE_KEY, TBSDetail, UNDER_REVIEW } from "../type";
import { ARIA_LABELS, CONST } from 'common/constants'
import { TBSSummary } from "../../kgDataset";
import { BsFeatureService } from "../../service";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { TDatainfos } from "src/util/siibraApiConstants/types";

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
  public useClassicUi = false

  public description: string
  public name: string
  public urls: {
    cite: string
    doi: string
  }[]

  constructor(
    svc: BsFeatureService,
    @Optional() @Inject(MAT_DIALOG_DATA) data: TDatainfos
  ){
    super(svc)
    if (data) {
      const { description, name, urls, useClassicUi } = data
      this.description = description
      this.name = name
      this.urls = urls
      this.useClassicUi = useClassicUi
    }
  }

  ngOnChanges(){
    if (!this.region) return
    if (!this.summary) return
    if (!!this.detail) return
    this.loadingFlag = true
    this.getFeatureInstance(KG_REGIONAL_FEATURE_KEY, this.summary['@id']).subscribe(
      detail => {
        this.detail = detail

        this.name = this.detail.src_name
        this.description = this.detail.__detail?.description
        this.urls = this.detail.__detail.kgReference.map(url => {
          return { cite: null, doi: url }
        })
        
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
