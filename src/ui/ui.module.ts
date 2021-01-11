import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components/components.module";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LayoutModule } from "src/layouts/layout.module";
// import { NehubaContainer } from "./nehubaContainer/nehubaContainer.component";

import { FilterRegionDataEntries } from "src/util/pipes/filterRegionDataEntries.pipe";
import { GroupDatasetByRegion } from "src/util/pipes/groupDataEntriesByRegion.pipe";

import { GetLayerNameFromDatasets } from "../util/pipes/getLayerNamePipe.pipe";
import { SortDataEntriesToRegion } from "../util/pipes/sortDataEntriesIntoRegion.pipe";
import { CitationsContainer } from "./citation/citations.component";

import { ScrollingModule } from "@angular/cdk/scrolling"
import { HttpClientModule } from "@angular/common/http";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { AppendtooltipTextPipe } from "src/util/pipes/appendTooltipText.pipe";
import { FlatmapArrayPipe } from "src/util/pipes/flatMapArray.pipe";
import { GetFileExtension } from "src/util/pipes/getFileExt.pipe";
import { UtilModule } from "src/util";
import { DownloadDirective } from "../util/directives/download.directive";
import { SpatialLandmarksToDataBrowserItemPipe } from "../util/pipes/spatialLandmarksToDatabrowserItem.pipe";


import { DatabrowserModule } from "../atlasComponents/databrowserModule/databrowser.module";

import { LogoContainer } from "./logoContainer/logoContainer.component";
import { MobileOverlay } from "./nehubaContainer/mobileOverlay/mobileOverlay.component";
import { MobileControlNubStylePipe } from "./nehubaContainer/pipes/mobileControlNubStyle.pipe";
// import { StatusCardComponent } from "./nehubaContainer/statusCard/statusCard.component";

import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { KgSearchBtnColorPipe } from "src/util/pipes/kgSearchBtnColor.pipe";
import { PluginBtnFabColorPipe } from "src/util/pipes/pluginBtnFabColor.pipe";
import { TemplateParcellationHasMoreInfo } from "src/util/pipes/templateParcellationHasMoreInfo.pipe";

import { ReorderPanelIndexPipe } from "./nehubaContainer/reorderPanelIndex.pipe";

import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";

import { ShareModule } from "src/share";
import { AuthModule } from "src/auth";
import { ActionDialog } from "./actionDialog/actionDialog.component";
import { APPEND_SCRIPT_TOKEN, appendScriptFactory } from "src/util/constants";
import { DOCUMENT } from "@angular/common";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RegionalFeaturesModule } from "../atlasComponents/regionalFeatures";
import { Landmark2DModule } from "./nehubaContainer/2dLandmarks/module";
import { HANDLE_SCREENSHOT_PROMISE, TypeHandleScrnShotPromise } from "./screenshot";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { AtlasCmpParcellationModule } from "src/atlasComponents/parcellation";
import { AtlasCmptConnModule } from "src/atlasComponents/connectivity";

@NgModule({
  imports : [
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    ComponentsModule,
    DatabrowserModule,
    UtilModule,
    ScrollingModule,
    AngularMaterialModule,
    ShareModule,
    AuthModule,
    RegionalFeaturesModule,
    Landmark2DModule,
    ParcellationRegionModule,
    AtlasCmpParcellationModule,
    AtlasCmptConnModule,
  ],
  declarations : [
    // NehubaContainer,
    
    CitationsContainer,
    LogoContainer,
    MobileOverlay,

    // StatusCardComponent,

    ActionDialog,

    /* pipes */
    GroupDatasetByRegion,
    FilterRegionDataEntries,
    FlatmapArrayPipe,
    GetLayerNameFromDatasets,
    SortDataEntriesToRegion,
    SpatialLandmarksToDataBrowserItemPipe,
    AppendtooltipTextPipe,
    MobileControlNubStylePipe,
    PluginBtnFabColorPipe,
    KgSearchBtnColorPipe,
    GetFileExtension,

    TemplateParcellationHasMoreInfo,
    HumanReadableFileSizePipe,
    ReorderPanelIndexPipe,

    /* directive */
    DownloadDirective,
    FixedMouseContextualContainerDirective,
  ],
  providers: [
    {
      provide: APPEND_SCRIPT_TOKEN,
      useFactory: appendScriptFactory,
      deps: [ DOCUMENT ]
    },
    {
      provide: HANDLE_SCREENSHOT_PROMISE,
      useValue: ((param) => {
        const canvas: HTMLCanvasElement = document.querySelector('#neuroglancer-container canvas')
        if (!canvas) return Promise.reject(`element '#neuroglancer-container canvas' not found`)
        const _ = (window as any).viewer.display.draw()
        if (!param) {
          return new Promise(rs => {
            canvas.toBlob(blob => {
              const url = URL.createObjectURL(blob)
              rs({
                url,
                revoke: () => URL.revokeObjectURL(url)
              })
            }, 'image/png')
          })
        }
        const { x, y, width, height } = param
        const { devicePixelRatio: dpr } = window
        return new Promise(rs => {
          const subCanvas = document.createElement('canvas')
          subCanvas.width = width * dpr
          subCanvas.height = height * dpr
          const context = subCanvas.getContext('2d')
          context.drawImage(
            canvas,

            /**
             * from
             */
            x * dpr,
            y * dpr,
            width * dpr,
            height * dpr,

            /**
             * to
             */
            0,
            0,
            width * dpr,
            height * dpr
          )

          subCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob)
            rs({
              url,
              revoke: () => URL.revokeObjectURL(url)
            })
          }, 'image/png')
        })
      }) as TypeHandleScrnShotPromise
    }
  ],
  entryComponents : [

    /* dynamically created components needs to be declared here */
    
    ActionDialog,
  ],
  exports : [
    CitationsContainer,
    // NehubaContainer,
    
    LogoContainer,
    MobileOverlay,
    
    // StatusCardComponent,
    FixedMouseContextualContainerDirective,
  ]
})

export class UIModule {
}
