import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { SapiViewsCoreSpaceBoundingBox } from "./boundingBox.directive";
import { PreviewSpaceUrlPipe } from "./previewSpaceUrl.pipe";
import { SapiViewsCoreSpaceSpaceTile } from "./tile/space.tile.component";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
  ],
  declarations: [
    SapiViewsCoreSpaceSpaceTile,
    PreviewSpaceUrlPipe,
    SapiViewsCoreSpaceBoundingBox,
  ],
  exports: [
    SapiViewsCoreSpaceSpaceTile,
    SapiViewsCoreSpaceBoundingBox,
  ]
})

export class SapiViewsCoreSpaceModule{}