import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { RegionalFeaturesService } from "../../regionalFeature.service";
import { FilterReceptorByType } from "./filterReceptorBytype.pipe";
import { GetAllReceptorsPipe } from "./getAllReceptors.pipe";
import { GetIdPipe } from "./getId.pipe";
import { GetUrlsPipe } from "./getUrl.pipe";
import { ReceptorDensityFeatureCmp } from "./receptorDensity/receptorDensity.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    ReceptorDensityFeatureCmp,
    FilterReceptorByType,
    GetIdPipe,
    GetAllReceptorsPipe,
    GetUrlsPipe,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})

export class ReceptorDensityModule{
  constructor(
    rService: RegionalFeaturesService
  ){
    rService.mapFeatToCmp.set(`Receptor density measurement`, ReceptorDensityFeatureCmp)
  }
}
