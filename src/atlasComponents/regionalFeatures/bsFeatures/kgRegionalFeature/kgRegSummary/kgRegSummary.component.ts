import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { BsFeatureService } from "../../service";
import { KG_REGIONAL_FEATURE_KEY, TBSDetail, TBSSummary } from '../type'

@Component({
  selector: 'kg-regional-feature-summary',
  templateUrl: './kgRegSummary.template.html',
  styleUrls: [
    './kgRegSummary.style.css'
  ],
  exportAs: 'kgRegionalFeatureSummary'
})

export class KgRegSummaryCmp extends BsRegionInputBase implements OnChanges{

  @Input()
  public loadFull = false

  @Input()
  public summary: TBSSummary = null

  public detailLoaded = false
  public loadingDetail = false
  public detail: TBSDetail = null
  @Output()
  public loadedDetail = new EventEmitter<TBSDetail>()

  public error: string = null
  @Output()
  public errorEmitter = new EventEmitter<string>()

  constructor(svc: BsFeatureService){
    super(svc)
  }

  ngOnChanges(){
    if (this.loadFull && !!this.summary) {
      if (this.loadingDetail || this.detailLoaded) {
        return
      }
      this.loadingDetail = true
      this.getFeatureInstance(KG_REGIONAL_FEATURE_KEY, this.summary["@id"]).subscribe(
        detail => {
          this.detail = detail
          this.loadedDetail.emit(detail)
        },
        err => {
          this.error = err
          this.errorEmitter.emit(err)
        },
        () => {
          this.detailLoaded = true
          this.loadingDetail = false
        } 
      )
    }
  }
}
