import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { SapiViewsCoreSpaceBoundingBox } from "./boundingBox.directive";
import { PreviewSpaceUrlPipe } from "./previewSpaceUrl.pipe";
import { SapiViewsCoreSpaceSpaceTile } from "./tile/space.tile.component";
import {
  SapiViewCoreSpaceSmartChip
} from "src/atlasComponents/sapiViews/core/space/smartChip/space.smartChip.components";
import {SapiViewCoreSpaceChip} from "src/atlasComponents/sapiViews/core/space/chip/space.chip.component";
import { AngularMaterialModule } from "src/sharedModules";
import { DialogModule } from "src/ui/dialogInfo/module";
import { SapiViewsUtilModule } from "../../util";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    AngularMaterialModule,
    DialogModule,
    SapiViewsUtilModule,
  ],
  declarations: [
    SapiViewsCoreSpaceSpaceTile,
    PreviewSpaceUrlPipe,
    SapiViewsCoreSpaceBoundingBox,
    SapiViewCoreSpaceSmartChip,
    SapiViewCoreSpaceChip
  ],
  exports: [
    SapiViewsCoreSpaceSpaceTile,
    SapiViewsCoreSpaceBoundingBox,
    SapiViewCoreSpaceSmartChip,
    SapiViewCoreSpaceChip
  ]
})

export class SapiViewsCoreSpaceModule{}
