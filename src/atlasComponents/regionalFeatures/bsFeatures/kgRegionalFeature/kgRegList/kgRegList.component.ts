import { ChangeDetectionStrategy, Component, Inject, Input, OnDestroy, Optional } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { filter, switchMap, tap } from "rxjs/operators";
import { TCountedDataModality } from '../../kgDataset'
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { BsFeatureService, TFeatureCmpInput } from "../../service";
import { KG_REGIONAL_FEATURE_KEY, TBSDetail, TBSSummary } from "../type";
import { ARIA_LABELS } from 'common/constants'
import { REGISTERED_FEATURE_INJECT_DATA } from "../../constants";

@Component({
  selector: 'kg-regional-features-list',
  templateUrl: './kgRegList.template.html',
  styleUrls: [
    './kgRegList.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class KgRegionalFeaturesList extends BsRegionInputBase implements OnDestroy{

  public ARIA_LABELS = ARIA_LABELS

  public dataModalities: TCountedDataModality[] = []

  @Input()
  public disableVirtualScroll = false
  
  public visibleRegionalFeatures: TBSSummary[] = []
  public kgRegionalFeatures: TBSSummary[] = []
  public kgRegionalFeatures$ = this.region$.pipe(
    filter(v => {
      this.busy$.next(false)
      return !!v
    }),
    // must not use switchmapto here
    switchMap(() => {
      this.busy$.next(true)
      return this.getFeatureInstancesList(KG_REGIONAL_FEATURE_KEY).pipe(
        tap(() => {
          this.busy$.next(false)
        })
      )
    })
  )
  constructor(
    svc: BsFeatureService,
    @Optional() @Inject(REGISTERED_FEATURE_INJECT_DATA) data: TFeatureCmpInput
  ){
    super(svc, data)
    this.sub.push(
      this.kgRegionalFeatures$.subscribe(val => {
        this.kgRegionalFeatures = val
        this.visibleRegionalFeatures = val
      })
    )
  }
  private sub: Subscription[] = []
  ngOnDestroy(){
    while (this.sub.length) this.sub.pop().unsubscribe()
  }

  public trackByFn(_index: number, dataset: TBSSummary) {
    return dataset['@id']
  }

  public detailDict: {
    [key: string]: TBSDetail
  } = {}

  public handlePopulatedDetailEv(detail: TBSDetail){
    this.detailDict = {
      ...this.detailDict,
      [detail["@id"]]: detail
    }
    for (const method of detail.__detail.methods) {
      const found = this.dataModalities.find(v => v.name === method)
      if (found) found.occurance = found.occurance + 1
      else this.dataModalities.push({
        name: method,
        occurance: 1,
        visible: false
      })
    }
    this.dataModalities = [...this.dataModalities]
  }

  public busy$ = new BehaviorSubject(false)
}
