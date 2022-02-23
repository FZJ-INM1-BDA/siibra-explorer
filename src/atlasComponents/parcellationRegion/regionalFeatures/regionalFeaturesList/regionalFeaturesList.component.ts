import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { filter, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionalFeatureModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'regional-features-list',
  templateUrl: './regionalFeaturesList.template.html',
  styleUrls: [
    './regionalFeaturesList.style.css'
  ]
})

export class RegionalFeaturesList implements OnChanges, OnInit{

  @Input()
  atlas: SapiAtlasModel

  @Input()
  template: SapiSpaceModel

  @Input()
  parcellation: SapiParcellationModel

  @Input()
  region: SapiRegionModel

  private ATPR$ = new BehaviorSubject<{
    atlas: SapiAtlasModel
    template: SapiSpaceModel
    parcellation: SapiParcellationModel
    region: SapiRegionModel
  }>(null)

  public listOfFeatures$: Observable<SapiRegionalFeatureModel[]> = this.ATPR$.pipe(
    filter(arg => {
      if (!arg) return false
      const { atlas, parcellation, region, template } = arg
      return !!atlas && !!parcellation && !!region && !!template 
    }),
    switchMap(({ atlas, parcellation, region, template }) => this.sapi.getRegionFeatures(atlas["@id"], parcellation["@id"], template["@id"], region.name)),
    startWith([]),
    shareReplay(1),
  )

  ngOnChanges(): void {
    const { atlas, template, parcellation, region } = this
    this.ATPR$.next({ atlas, template, parcellation, region })
  }

  ngOnInit(): void {
    // this.ngOnChanges()
  }

  constructor(private sapi: SAPI){
  }
}
