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
import {RegionTreeComponent} from "src/atlasComponents/parcellation/regionHierachy/region-tree/region-tree.component";
import { GetParcPreviewUrlPipe } from "./getParcPreviewUrl.pipe";
import {PreSizedArrayPipe} from "src/atlasComponents/parcellation/regionHierachy/region-tree/pre-sized-array.pipe";
import {HighlightPipe} from "src/atlasComponents/parcellation/regionHierachy/region-tree/highlight.pipe";
import {TreeDashesPipe} from "src/atlasComponents/parcellation/regionHierachy/region-tree/tree-dashes.pipe";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    ParcellationRegionModule,
    ComponentsModule,
  ],
  declarations: [
    RegionHierarchy,
    RegionTextSearchAutocomplete,

    FilterNameBySearch,
    RegionTreeComponent,
    GetParcPreviewUrlPipe,
    HighlightPipe,
    PreSizedArrayPipe,
    TreeDashesPipe,
  ],
  exports: [
    RegionHierarchy,
    RegionTextSearchAutocomplete,
    FilterNameBySearch,
    GetParcPreviewUrlPipe,
  ]
})
export class AtlasCmpParcellationModule{}
