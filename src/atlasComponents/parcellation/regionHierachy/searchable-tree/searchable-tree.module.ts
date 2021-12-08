import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HighlightPipe} from "src/atlasComponents/parcellation/regionHierachy/searchable-tree/highlight.pipe";
import {PreSizedArrayPipe} from "src/atlasComponents/parcellation/regionHierachy/searchable-tree/pre-sized-array.pipe";
import {TreeDashesPipe} from "src/atlasComponents/parcellation/regionHierachy/searchable-tree/tree-dashes.pipe";
import {UtilModule} from "src/util";
import {SearchableTreeComponent} from "src/atlasComponents/parcellation/regionHierachy/searchable-tree/searchable-tree.component";
import {AngularMaterialModule} from "src/sharedModules";



@NgModule({
  declarations: [
    SearchableTreeComponent,
    HighlightPipe,
    PreSizedArrayPipe,
    TreeDashesPipe,
  ],
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule
  ],
  exports: [
    SearchableTreeComponent
  ]
})
export class SearchableTreeModule { }
