import { ScrollingModule } from "@angular/cdk/scrolling";
import { CdkTreeModule } from "@angular/cdk/tree";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { FlatHierarchySpacer } from "./spacer.pipe";
import { SxplrFlatHierarchyTreeView } from "./treeView/treeView.component";

@NgModule({
  imports: [
    CommonModule,
    CdkTreeModule,
    ScrollingModule,
    AngularMaterialModule,
  ],
  declarations: [
    SxplrFlatHierarchyTreeView,
    FlatHierarchySpacer,
  ],
  exports: [
    SxplrFlatHierarchyTreeView
  ]
})

export class SxplrFlatHierarchyModule{}