import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { FilterGroupedParcellationPipe } from "./filterGroupedParcellations.pipe";
import { FilterUnsupportedParcPipe } from "./filterUnsupportedParc.pipe";
import { PreviewParcellationUrlPipe } from "./previewParcellationUrl.pipe";
import { SapiViewsCoreParcellationParcellationTile } from "./tile/parcellation.tile.component";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    AngularMaterialModule,
  ],
  declarations: [
    SapiViewsCoreParcellationParcellationTile,
    PreviewParcellationUrlPipe,
    FilterGroupedParcellationPipe,
    FilterUnsupportedParcPipe,
  ],
  exports: [
    SapiViewsCoreParcellationParcellationTile,
    FilterGroupedParcellationPipe,
    FilterUnsupportedParcPipe,
  ]
})

export class SapiViewsCoreParcellationModule{}