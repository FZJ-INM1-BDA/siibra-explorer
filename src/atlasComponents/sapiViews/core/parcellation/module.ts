import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { StrictLocalModule } from "src/strictLocal";
import { DialogModule } from "src/ui/dialogInfo/module";
import { UtilModule } from "src/util";
import { SapiViewsUtilModule } from "../../util";
import { FilterGroupedParcellationPipe } from "./filterGroupedParcellations.pipe";
import { FilterUnsupportedParcPipe } from "./filterUnsupportedParc.pipe";
import { ParcTmplDoiPipe } from "./parcTmplDoi.pipe";
import { ParcellationVisibilityService } from "./parcellationVis.service";
import { ParcellationGroupSelectedPipe } from "./parcellationGroupSelected.pipe";
import { IsGroupedParcellation } from "./isGroupedParcellation.pipe";
import { EffectsModule } from "@ngrx/effects";
import { ParcellationVisEffect } from "./parcellationVis.effect";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    AngularMaterialModule,
    UtilModule,
    SapiViewsUtilModule,
    DialogModule,
    StrictLocalModule,
    EffectsModule.forFeature([
      ParcellationVisEffect
    ])
  ],
  declarations: [
    FilterGroupedParcellationPipe,
    FilterUnsupportedParcPipe,
    ParcTmplDoiPipe,
    ParcellationGroupSelectedPipe,
    IsGroupedParcellation,
  ],
  exports: [
    FilterGroupedParcellationPipe,
    FilterUnsupportedParcPipe,
    ParcellationGroupSelectedPipe,
    ParcTmplDoiPipe,
    IsGroupedParcellation,
  ],
  providers: [
    ParcellationVisibilityService,
  ]
})

export class SapiViewsCoreParcellationModule{}