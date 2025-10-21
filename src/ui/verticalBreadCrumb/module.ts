import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { VerticalBreadCrumbComponent } from "./vbc/vbc.component";
import { AngularMaterialModule } from "src/sharedModules";
import { SapiViewsCoreParcellationModule } from "src/atlasComponents/sapiViews/core/parcellation";
import { DialogModule } from "../dialogInfo";
import { SapiViewsCoreRichModule } from "src/atlasComponents/sapiViews/core/rich/module";
import { UtilModule } from "src/util";
import { SapiViewsCoreRegionModule } from "src/atlasComponents/sapiViews/core/region";
import { SapiViewsUtilModule } from "src/atlasComponents/sapiViews";
import { ShareModule } from "src/share";
import { FeatureModule } from "src/features";
import { SapiViewsCoreSpaceModule } from "src/atlasComponents/sapiViews/core/space";
import { ReactiveFormsModule } from "@angular/forms";
import { AtlasDownloadModule } from "src/atlas-download/atlas-download.module";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { DoiTemplate } from "../doi/doi.component";
import { OnFocusSelectDirective } from "./focusSelect.directive";
import { SxplrDumbFeatureList } from "src/features/dumbList/dumbList.component";
import { TPBRViewCmp } from "src/features/TPBRView/TPBRView.component";
import { VolumesModule } from "src/atlasComponents/sapiViews/volumes/volumes.module";
import { TabComponent } from "src/components/tab/tab.components";
import { SimpleAssignmentView } from "src/atlasComponents/sapiViews/volumes/assignment-views/simple/assignment-view-simple.component";
import { FullAssignmentView } from "src/atlasComponents/sapiViews/volumes/assignment-views/full/assignment-view-full.component";
import { ZipFilesOutputModule } from "src/zipFilesOutput/module";
import { MarkdownModule } from "src/components/markdown";
import { NgLayerCtrlCmp } from "src/viewerModule/nehuba/nehubaViewerInterface/ngLayerCtl/ngLayerCtrl.component";
import { PlotComponent } from "src/features/plotly/plot/plot.component";
import { MediaQueryDirective } from "src/util/directives/mediaQuery.directive";
import { AnnotationDirective } from "src/atlasComponents/annotations/annotation.directive";
import { CurrentViewportToTextPipe } from "./pipes/currentViewPort.pipe";
import { UserAnnotationsModule } from "src/atlasComponents/userAnnotations";
import { StateModule } from "src/state";
import { ScreenshotModule } from "src/screenshot";
import { KeyFrameModule } from "src/keyframesModule/module";
import { PluginModule } from "src/plugin";
import { LabelEventDirective } from "./labelEvent.directive";
import { AtlasViewerRouterModule } from "src/routerModule";
import { FileInputModule } from "src/getFileInput/module";
import { SpotLightModule } from "src/spotlight/spot-light.module";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsCoreParcellationModule,
    SapiViewsCoreRichModule,
    DialogModule,
    UtilModule,
    SapiViewsCoreRegionModule,
    SapiViewsUtilModule,
    ShareModule,
    AtlasDownloadModule,
    ExperimentalFlagDirective,
    FeatureModule,
    SapiViewsCoreSpaceModule,
    ReactiveFormsModule,
    DoiTemplate,
    SxplrDumbFeatureList,
    TPBRViewCmp,
    VolumesModule,
    TabComponent,
    SimpleAssignmentView,
    FullAssignmentView,
    ZipFilesOutputModule,
    MarkdownModule,
    NgLayerCtrlCmp,
    PlotComponent,
    MediaQueryDirective,
    AnnotationDirective,
    UserAnnotationsModule,
    StateModule,
    ScreenshotModule,
    KeyFrameModule,
    PluginModule,
    LabelEventDirective,
    AtlasViewerRouterModule,
    FileInputModule,
    SpotLightModule,
],
  declarations: [
    VerticalBreadCrumbComponent,
    OnFocusSelectDirective,
    CurrentViewportToTextPipe,
  ],
  exports: [
    VerticalBreadCrumbComponent,
  ]
})

export class VerticalBreadCrumbModule{}
