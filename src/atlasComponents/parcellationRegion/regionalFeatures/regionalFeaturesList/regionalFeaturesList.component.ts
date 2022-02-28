import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, shareReplay, startWith, switchMap } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionalFeatureModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";

@Component({
  selector: 'regional-features-list',
  templateUrl: './regionalFeaturesList.template.html',
  styleUrls: [
    './regionalFeaturesList.style.css'
  ]
})

export class RegionalFeaturesList implements OnChanges{

  @Input('regional-features-list-atlas')
  atlas: SapiAtlasModel

  @Input('regional-features-list-template')
  template: SapiSpaceModel

  @Input('regional-features-list-parcellation')
  parcellation: SapiParcellationModel

  @Input('regional-features-list-region')
  region: SapiRegionModel

  @Output('regional-features-list-feat-clicked')
  featureClicked = new EventEmitter<SapiRegionalFeatureModel>()

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

  constructor(private sapi: SAPI){}

  showFeature(feat: SapiRegionalFeatureModel){
    this.featureClicked.emit(feat)
    console.log('emitting bla')
  }
}
