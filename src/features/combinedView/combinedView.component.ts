import { Component, Input } from "@angular/core";
import { TPRB } from "../util";
import { BehaviorSubject, concat, of } from "rxjs";
import { AngularMaterialModule } from "src/sharedModules";
import { CommonModule } from "@angular/common";
import { debounceTime, map, switchMap } from "rxjs/operators";
import { FeatureModule } from "../module";
import { UtilModule } from "src/util";
import { SapiViewsCoreSpaceModule } from "src/atlasComponents/sapiViews/core/space";
import { VolumesModule } from "src/atlasComponents/sapiViews/volumes/volumes.module";

@Component({
  selector: 'feature-combined-view',
  templateUrl: './combinedView.template.html',
  styleUrls: [
    './combinedView.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FeatureModule,
    UtilModule,
    SapiViewsCoreSpaceModule,
    VolumesModule,
  ]
})

export class FeatureCombinedViewCmp {

  #tprb = new BehaviorSubject<TPRB|null>(null)

  @Input()
  set tprb(tprb: TPRB){
    this.#tprb.next(tprb)
  }

  tprb$ = this.#tprb.pipe(
    debounceTime(1000),
  )
}