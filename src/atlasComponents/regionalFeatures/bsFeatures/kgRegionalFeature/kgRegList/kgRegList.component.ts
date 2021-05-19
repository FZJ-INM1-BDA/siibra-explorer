import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { filter, switchMap, tap } from "rxjs/operators";
import { TCountedDataModality } from '../../kgDataset'
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { BsFeatureService } from "../../service";
import { TBSDetail, TBSSummary } from "../type";
import { ARIA_LABELS } from 'common/constants'
import { filterKgFeatureByModailty } from "../../kgDataset/util";

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
    filter(v => !!v),
    // must not use switchmapto here
    switchMap(() => this.getFeatureInstancesList('KgRegionalFeature'))
  )
  constructor(private cdr: ChangeDetectorRef, svc: BsFeatureService){
    super(svc)
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

  public handleModalityVisbilityChange(modalityFilter: TCountedDataModality[]){
    this.dataModalities = modalityFilter
    const visibleCountedDataM = modalityFilter.filter(dm => dm.visible)

    const filterFunc = filterKgFeatureByModailty(visibleCountedDataM)
    this.visibleRegionalFeatures = this.kgRegionalFeatures.filter(sum => {
      const detail = this.detailDict[sum['@id']]
      if (!detail) return false
      return filterFunc(detail)
    })
    this.cdr.markForCheck()
  }

  public clearFilters(){
    const dataModalities = this.dataModalities.map(v => {
      return {
        ...v,
        visible: false
      }
    })
    this.handleModalityVisbilityChange(dataModalities)
  }
}
