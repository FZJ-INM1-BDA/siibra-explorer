import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SpinnerModule } from "src/components/spinner";
import { AngularMaterialModule } from "src/sharedModules";
import { QuickTourModule } from "src/ui/quickTour";
import { SapiViewsUtilModule } from "../../util";
import { SapiViewsCoreParcellationModule } from "../parcellation";
import { SapiViewsCoreSpaceModule } from "../space";
import { SapiViewsCoreAtlasAtlasDropdownSelector } from "./dropdownAtlasSelector/dropdownAtlasSelector.component";
import { SapiViewsCoreAtlasSplashScreen } from "./splashScreen/splashScreen.component";
import { SapiViewsCoreAtlasAtlasTmplParcSelector } from "./tmplParcSelector/tmplParcSelector.component";
import {DialogModule} from "src/ui/dialogInfo/module";
import {
  SapiViewCoreAtlasSmartChip
} from "src/atlasComponents/sapiViews/core/atlas/smartChip/atlas.smartChip.components";
import {UtilModule} from "src/util";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsCoreSpaceModule,
    SapiViewsCoreParcellationModule,
    QuickTourModule,
    SpinnerModule,
    SapiViewsUtilModule,
    DialogModule,
    UtilModule
  ],
  declarations: [
    SapiViewsCoreAtlasAtlasDropdownSelector,
    SapiViewsCoreAtlasAtlasTmplParcSelector,
    SapiViewsCoreAtlasSplashScreen,
    SapiViewCoreAtlasSmartChip,
  ],
  exports: [
    SapiViewsCoreAtlasAtlasDropdownSelector,
    SapiViewsCoreAtlasAtlasTmplParcSelector,
    SapiViewsCoreAtlasSplashScreen,
    SapiViewCoreAtlasSmartChip,
  ]
})

export class SapiViewsCoreAtlasModule{}
