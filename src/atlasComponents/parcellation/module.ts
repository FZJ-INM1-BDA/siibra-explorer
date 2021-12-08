import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { RegionHierarchy } from "./regionHierachy/regionHierarchy.component";
import { RegionTextSearchAutocomplete } from "./regionSearch/regionSearch.component";
import { FilterNameBySearch } from "./regionHierachy/filterNameBySearch.pipe";
import { UtilModule } from "src/util";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components";
import { GetParcPreviewUrlPipe } from "./getParcPreviewUrl.pipe";
import {SearchableTreeModule} from "src/atlasComponents/parcellation/regionHierachy/searchable-tree/searchable-tree.module";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    ParcellationRegionModule,
    ComponentsModule,
    SearchableTreeModule
  ],
  declarations: [
    RegionHierarchy,
    RegionTextSearchAutocomplete,

    FilterNameBySearch,
    GetParcPreviewUrlPipe,

  ],
  exports: [
    RegionHierarchy,
    RegionTextSearchAutocomplete,
    FilterNameBySearch,
    GetParcPreviewUrlPipe,
  ]
})
export class AtlasCmpParcellationModule{}
