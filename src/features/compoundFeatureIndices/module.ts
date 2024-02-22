import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { CompoundFeatureIndices } from "./compoundFeatureIndices.component";
import { IndexToStrPipe } from "./idxToText.pipe";
import { IndexToIconPipe } from "./idxToIcon.pipe";
import { PointCloudIntents, FilterPointTransformer } from "src/features/pointcloud-intents";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    PointCloudIntents,
  ],
  declarations: [
    CompoundFeatureIndices,
    IndexToStrPipe,
    IndexToIconPipe,
    FilterPointTransformer,
  ],
  exports: [
    CompoundFeatureIndices,
  ]
})

export class CompoundFeatureIndicesModule{}
