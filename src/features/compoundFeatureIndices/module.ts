import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { CompoundFeatureIndices } from "./compoundFeatureIndices.component";
import { IndexToStrPipe } from "./idxToText.pipe";
import { IndexToIconPipe } from "./idxToIcon.pipe";
// import { PointCloudIntents, FilterPointTransformer } from "src/features/pointcloud-intents";
// import { RENDER_CF_POINT, RenderCfPoint } from "../pointcloud-intents/intents.component";


@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    // PointCloudIntents,
  ],
  declarations: [
    CompoundFeatureIndices,
    IndexToStrPipe,
    IndexToIconPipe,
    // FilterPointTransformer,
  ],
  exports: [
    CompoundFeatureIndices,
  ],
  providers: [
    // {
    //   provide: RENDER_CF_POINT,
    //   useFactory: () => {
    //     const pipe = new IndexToStrPipe()
    //     const renderCfPoint: RenderCfPoint = cfIndex => pipe.transform(cfIndex.index)
    //     return renderCfPoint
    //   }
    // }
  ]
})

export class CompoundFeatureIndicesModule{}
