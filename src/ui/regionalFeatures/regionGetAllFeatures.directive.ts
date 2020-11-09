import { Directive, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { RegionFeatureBase } from "./regionFeature.base";

@Directive({
  selector: '[region-get-all-features-directive]',
  exportAs: 'rfGetAllFeatures'
})

export class RegionGetAllFeaturesDirective extends RegionFeatureBase implements OnDestroy, OnInit{
  @Output()
  loadingStateChanged: EventEmitter<boolean> = new EventEmitter()

  private subscriptions: Subscription[] = []

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
