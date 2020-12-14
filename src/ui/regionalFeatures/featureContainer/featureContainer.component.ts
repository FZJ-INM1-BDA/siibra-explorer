import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentFactoryResolver, ComponentRef, Input, OnChanges, Output, SimpleChanges, ViewContainerRef, EventEmitter } from "@angular/core";
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

  @Output()
  viewChanged: EventEmitter<boolean> = new EventEmitter()

  private cr: ComponentRef<ISingleFeature>
  
  constructor(
    private vCRef: ViewContainerRef,
    private rService: RegionalFeaturesService,
    private cfr: ComponentFactoryResolver,
  ){
  }

  private viewChangedSub: Subscription

  ngOnChanges(simpleChanges: SimpleChanges){
    if (!simpleChanges.feature) return
    const { currentValue, previousValue } = simpleChanges.feature
    if (currentValue === previousValue) return
    this.clear()

    /**
     * catching instances where currentValue for feature is falsy
     */
    if (!currentValue) return

    /**
     * TODO catch if map is undefined
     */
    const comp = this.rService.mapFeatToCmp.get(currentValue.type)
    if (!comp) throw new Error(`mapFeatToCmp for ${currentValue.type} not defined`)
    const cf = this.cfr.resolveComponentFactory<ISingleFeature>(comp)
    this.cr = this.vCRef.createComponent(cf)
    this.cr.instance.feature = this.feature
    this.cr.instance.region = this.region
    this.viewChangedSub = this.cr.instance.viewChanged.subscribe(() => this.viewChanged.emit(true))
  }

  clear(){
    if (this.viewChangedSub) this.viewChangedSub.unsubscribe()
    this.vCRef.clear()
  }
}
