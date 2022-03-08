import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
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
  ],
  exports: [
    SapiViewsCoreSpaceSpaceTile,
  ]
})

export class SapiViewsCoreSpaceModule{}