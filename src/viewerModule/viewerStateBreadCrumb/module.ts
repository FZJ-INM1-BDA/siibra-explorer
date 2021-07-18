import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { KgDatasetModule } from "src/atlasComponents/regionalFeatures/bsFeatures/kgDataset";
import { QuickTourModule } from "src/ui/quickTour";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { ViewerStateBreadCrumb } from "./breadcrumb/breadcrumb.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    QuickTourModule,
    ParcellationRegionModule,
    KgDatasetModule,
    UtilModule,
  ],
  declarations: [
    ViewerStateBreadCrumb,
  ],
  exports: [
    ViewerStateBreadCrumb,
  ],
  providers:[
  ]
})

export class ViewerStateBreadCrumbModule{}