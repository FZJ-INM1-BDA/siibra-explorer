import { CommonModule } from "@angular/common";
import { Component, EventEmitter, HostBinding, Input, Output } from "@angular/core";
import { BehaviorSubject, combineLatest } from "rxjs";
import { Feature, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { FeatureFilterDirective } from "../feature.filter.directive";
import { map } from "rxjs/operators";
import { DedupPipe } from "src/util/pipes/dedup.pipe";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";

const dedupPipe = new DedupPipe()

type TFeature = Feature | VoiFeature

@Component({
  selector: 'sxplr-dumb-feature-list',
  standalone: true,
  templateUrl: './dumbList.template.html',
  styleUrls: [
    './dumbList.style.scss'
  ],
  imports: [
    CommonModule,
    FeatureFilterDirective,
    AngularMaterialModule,
    UtilModule,
  ]
})

export class SxplrDumbFeatureList {

  @Input()
  @HostBinding('class.dumblist-small')
  compact = false

  features$ = new BehaviorSubject<TFeature[]>([])

  @Input('features')
  set _features(features: TFeature[]) {
    this.features$.next(features)
  }

  @Output('feature-clicked')
  featureClicked = new EventEmitter<TFeature>()

  categories$ = this.features$.pipe(
    map(features => dedupPipe.transform(features.map(f => f.category)))
  )
  
  modalities$ = this.features$.pipe(
    map(features => dedupPipe.transform(features.map(f => f.modality)))
  )

  filteredFeatures(type: 'mod'|'cat', checked: string[]){
    if (type === 'mod') {
      return (f: TFeature, ..._args: any[]) => checked.includes(f.modality)
    }
    if (type === 'cat') {
      return (f: TFeature, ..._args: any[]) => checked.includes(f.category)
    }
    return (..._args: any[]) => false
  }

  view$ = combineLatest([
    this.categories$,
    this.modalities$,
    this.features$,
  ]).pipe(
    map(([ categories, modalities, features ]) => {
      return {
        categories, modalities, features
      }
    })
  )
}
