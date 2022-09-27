import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { SapiViewsCoreSpaceBoundingBox } from "./boundingBox.directive";
import { PreviewSpaceUrlPipe } from "./previewSpaceUrl.pipe";
import { SapiViewsCoreSpaceSpaceTile } from "./tile/space.tile.component";
import {
  SapiViewCoreSpaceSmartChip
} from "src/atlasComponents/sapiViews/core/space/smartChip/space.smartChip.components";
import { AngularMaterialModule } from "src/sharedModules";
import { DialogModule } from "src/ui/dialogInfo/module";
import { SapiViewsUtilModule } from "../../util";
import {UtilModule} from "src/util";
import {ReactiveFormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    DialogModule,
    SapiViewsUtilModule,
    UtilModule
  ],
  declarations: [
    SapiViewsCoreSpaceSpaceTile,
    PreviewSpaceUrlPipe,
    SapiViewsCoreSpaceBoundingBox,
    SapiViewCoreSpaceSmartChip,
  ],
  exports: [
    SapiViewsCoreSpaceSpaceTile,
    SapiViewsCoreSpaceBoundingBox,
    SapiViewCoreSpaceSmartChip,
  ]
})

export class SapiViewsCoreSpaceModule{}
