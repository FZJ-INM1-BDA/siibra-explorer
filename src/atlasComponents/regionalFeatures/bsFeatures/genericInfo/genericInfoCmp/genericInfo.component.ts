import { AfterViewInit, Component, Inject, Input, OnChanges, OnDestroy, Optional, TemplateRef, ViewChild, ViewContainerRef, ViewRef } from "@angular/core";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { KG_REGIONAL_FEATURE_KEY, TBSDetail, UNDER_REVIEW } from "../../kgRegionalFeature/type";
import { ARIA_LABELS, CONST } from 'common/constants'
import { TBSSummary } from "../../kgDataset";
import { BsFeatureService } from "../../service";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { TDatainfosDetail } from "src/util/siibraApiConstants/types";
import { TRegion } from "../../type";

/**
 * this component is specifically used to render side panel ebrains dataset view
 */

export type TInjectableData = TDatainfosDetail & {
  dataType?: string
  view?: ViewRef | TemplateRef<any>
  region?: TRegion
  summary?: TBSSummary
  isGdprProtected?: boolean
}

@Component({
  selector: 'generic-info-cmp',
  templateUrl: './genericInfo.template.html',
  styleUrls: [
    './genericInfo.style.css'
  ]
})

export class GenericInfoCmp extends BsRegionInputBase implements OnChanges, AfterViewInit, OnDestroy {

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
  public dataType = 'ebrains regional dataset'

  public description: string
  public name: string
  public urls: {
    cite: string
    doi: string
  }[]

  public doiUrls: {
    cite: string
    doi: string
  }[]

  template: TemplateRef<any>
  viewref: ViewRef

  @ViewChild('insertViewTarget', { read: ViewContainerRef })
  insertedViewVCR: ViewContainerRef

  constructor(
    svc: BsFeatureService,
    @Optional() @Inject(MAT_DIALOG_DATA) data: TInjectableData
  ){
    super(svc)
    if (data) {
      const { dataType, description, name, urls, useClassicUi, view, region, summary, isGdprProtected } = data
      this.description = description
      this.name = name
      this.urls = urls || []
      this.doiUrls = this.urls.filter(d => !!d.doi)
      this.useClassicUi = useClassicUi
      if (dataType) this.dataType = dataType
      if (typeof isGdprProtected !== 'undefined') this.isGdprProtected = isGdprProtected

      if (!!view) {
        if (view instanceof TemplateRef){
          this.template = view
        } else {
          this.viewref = view
        }
      }

      if (region && summary) {
        this.region = region
        this.summary = summary
        this.ngOnChanges()
      }
    }
  }

  ngOnDestroy(){
    this.insertedViewVCR.clear()
  }

  ngAfterViewInit(){
    if (this.insertedViewVCR && this.viewref) {
      this.insertedViewVCR.insert(this.viewref)
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
