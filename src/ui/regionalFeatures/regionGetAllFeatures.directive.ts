import { Directive, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { RegionalFeaturesService } from "./regionalFeature.service";
import { RegionFeatureBase } from "./regionFeature.base";

@Directive({
  selector: '[region-get-all-features-directive]',
  exportAs: 'rfGetAllFeatures'
})

export class RegionGetAllFeaturesDirective extends RegionFeatureBase implements OnDestroy, OnInit{
  @Output()
  loadingStateChanged: EventEmitter<boolean> = new EventEmitter()

  private subscriptions: Subscription[] = []

  /**
   * since the base class has DI
   * sub class needs to call super() with the correct DI
   */
  constructor(
    rfService: RegionalFeaturesService
  ){
    super(rfService)
  }

  ngOnInit(){
    this.subscriptions.push(
      this.isLoading$.subscribe(val => {
        this.loadingStateChanged.emit(val)
      })
    )
  }
  ngOnDestroy(){
    while (this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }
}
