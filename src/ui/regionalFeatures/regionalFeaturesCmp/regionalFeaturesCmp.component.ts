import { Component, OnChanges, OnDestroy, SimpleChanges, ViewChild } from "@angular/core";
import { MatSidenav } from "@angular/material/sidenav";
import { Observable, Subscription } from "rxjs";
import { shareReplay } from "rxjs/operators";
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN, TOverwriteShowDatasetDialog } from "src/util/interfaces";
import { RegionalFeaturesService } from "../regionalFeature.service";
import { RegionFeatureBase } from "../regionFeature.base";

@Component({
  selector: 'regional-features',
  templateUrl: './regionalFeaturesCmp.template.html',
  styleUrls: [
    './regionalFeaturesCmp.style.css'
  ],
  providers: [
    {
      provide: OVERWRITE_SHOW_DATASET_DIALOG_TOKEN,
      useFactory: (regionalFeatureService: RegionalFeaturesService) => {
        return function overwriteShowDatasetDialog( arg ){
          regionalFeatureService.showDatafeatureInfo$.next(arg)
        } as TOverwriteShowDatasetDialog
      },
      deps: [
        RegionalFeaturesService
      ]
    }
  ]
})

export class RegionalFeaturesCmp extends RegionFeatureBase implements OnDestroy, OnChanges{

  @ViewChild('sideNav', { read: MatSidenav })
  private sideNav: MatSidenav

  constructor(
    regionalFeatureService: RegionalFeaturesService
  ){
    super(regionalFeatureService)
    this.showDatafeatureInfo$ = regionalFeatureService.showDatafeatureInfo$.pipe(
      shareReplay(1)
    )
    this.subscription.push(
      this.showDatafeatureInfo$.subscribe(
        () => this.sideNav.open()
      )
    )
  }

  ngOnChanges(changes: SimpleChanges){
    super.ngOnChanges(changes)
  }

  private subscription: Subscription[] = []
  ngOnDestroy(){
    while (this.subscription.length > 0) this.subscription.pop().unsubscribe()
  }


  public showingRegionFeatureId: string
  public showingRegionFeatureIsLoading = false

  public showDatafeatureInfo$: Observable<{fullId: string}|{name: string, description: string}>
}
