import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { StrictLocalModule } from "src/strictLocal";
import { DialogModule } from "src/ui/dialogInfo/module";
import { UtilModule } from "src/util";
import { SapiViewsUtilModule } from "../../util";
import { FilterGroupedParcellationPipe } from "./filterGroupedParcellations.pipe";
import { ParcTmplDoiPipe } from "./parcTmplDoi.pipe";
import { ParcellationGroupSelectedPipe } from "./parcellationGroupSelected.pipe";
import { IsGroupedParcellation } from "./isGroupedParcellation.pipe";
import { ParcellationIsVersioned } from "./isVersioned.pipe";
import { ParcellationIsNewest } from "./isNewest.pipe";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    AngularMaterialModule,
    UtilModule,
    SapiViewsUtilModule,
    DialogModule,
    StrictLocalModule,
  ],
  declarations: [
    FilterGroupedParcellationPipe,
    ParcTmplDoiPipe,
    ParcellationGroupSelectedPipe,
    IsGroupedParcellation,
    ParcellationIsVersioned,
    ParcellationIsNewest,
  ],
  exports: [
    FilterGroupedParcellationPipe,
    ParcellationGroupSelectedPipe,
    ParcTmplDoiPipe,
    IsGroupedParcellation,
    ParcellationIsVersioned,
    ParcellationIsNewest,
  ],
  providers: [
  ]
})

export class SapiViewsCoreParcellationModule{}