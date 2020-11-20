import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { RegionalFeaturesService } from "../../regionalFeature.service";
import { IEEGRecordingsCmp } from "./iEEGRecordings/iEEGRecordings.component";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule,
    ComponentsModule,
  ],
  declarations: [
    IEEGRecordingsCmp
  ],
  exports: [
    IEEGRecordingsCmp
  ]
})

export class FeatureIEEGRecordings{
  constructor(
    rService: RegionalFeaturesService
  ){
    rService.mapFeatToCmp.set('iEEG recording', IEEGRecordingsCmp)
  }
}
