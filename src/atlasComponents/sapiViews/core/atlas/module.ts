import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SpinnerModule } from "src/components/spinner";
import { AngularMaterialModule } from "src/sharedModules";
import { QuickTourModule } from "src/ui/quickTour";
import { SapiViewsUtilModule } from "../../util";
import { SapiViewsCoreParcellationModule } from "../parcellation";
import { SapiViewsCoreSpaceModule } from "../space";
import { SapiViewsCoreAtlasAtlasDropdownSelector } from "./dropdownAtlasSelector/dropdownAtlasSelector.component";
import { SapiViewsCoreAtlasAtlasTmplParcSelector } from "./tmplParcSelector/tmplParcSelector.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsCoreSpaceModule,
    SapiViewsCoreParcellationModule,
    QuickTourModule,
    SpinnerModule,
    SapiViewsUtilModule,
  ],
  declarations: [
    SapiViewsCoreAtlasAtlasDropdownSelector,
    SapiViewsCoreAtlasAtlasTmplParcSelector,
  ],
  exports: [
    SapiViewsCoreAtlasAtlasDropdownSelector,
    SapiViewsCoreAtlasAtlasTmplParcSelector,
  ]
})

export class SapiViewsCoreAtlasModule{}