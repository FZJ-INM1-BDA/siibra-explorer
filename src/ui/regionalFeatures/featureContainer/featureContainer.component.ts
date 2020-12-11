import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentFactoryResolver, ComponentRef, Input, OnChanges, SimpleChanges, ViewContainerRef } from "@angular/core";
import { Subscription } from "rxjs";
import { IFeature, RegionalFeaturesService } from "../regionalFeature.service";
import { ISingleFeature } from "../singleFeatures/interfaces";

@Component({
  selector: 'feature-container',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class FeatureContainer implements OnChanges{
  @Input()
  feature: IFeature

  @Input()
  region: any

  private cr: ComponentRef<ISingleFeature>
  
  constructor(
    private vCRef: ViewContainerRef,
    private rService: RegionalFeaturesService,
    private cfr: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef
  ){
  }

  private viewChangedSub: Subscription

  ngOnChanges(simpleChanges: SimpleChanges){
    if (!simpleChanges.feature) return
    const { currentValue, previousValue } = simpleChanges.feature
    if (currentValue === previousValue) return
    this.clear()
    /**
     * TODO catch if map is undefined
     */
    const comp = this.rService.mapFeatToCmp.get(currentValue.type)
    const cf = this.cfr.resolveComponentFactory<ISingleFeature>(comp)
    this.cr = this.vCRef.createComponent(cf)
    this.cr.instance.feature = this.feature
    this.cr.instance.region = this.region
    this.viewChangedSub = this.cr.instance.viewChanged.subscribe(() => this.cdr.detectChanges())
  }

  clear(){
    if (this.viewChangedSub) this.viewChangedSub.unsubscribe()
    this.vCRef.clear()
  }
}
