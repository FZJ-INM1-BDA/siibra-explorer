import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { KgDatasetModule } from "src/atlasComponents/regionalFeatures/bsFeatures/kgDataset";
import { QuickTourModule } from "src/ui/quickTour";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { OriginalDatainfoPipe, ViewerStateBreadCrumb } from "./breadcrumb/breadcrumb.component";
import {ToggleParcellationDirective} from "src/viewerModule/viewerStateBreadCrumb/toggle-parcellation.directive";

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
    OriginalDatainfoPipe,
    ToggleParcellationDirective
  ],
  exports: [
    ViewerStateBreadCrumb,
  ],
  providers:[
  ]
})

export class ViewerStateBreadCrumbModule{}
