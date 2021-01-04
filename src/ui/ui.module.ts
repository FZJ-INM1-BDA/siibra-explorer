import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components/components.module";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LayoutModule } from "src/layouts/layout.module";
import { NehubaContainer } from "./nehubaContainer/nehubaContainer.component";
import { GetTemplateImageSrcPipe, ImgSrcSetPipe, SplashScreen } from "./nehubaContainer/splashScreen/splashScreen.component";

import { FilterRegionDataEntries } from "src/util/pipes/filterRegionDataEntries.pipe";
import { GroupDatasetByRegion } from "src/util/pipes/groupDataEntriesByRegion.pipe";

import { GetLayerNameFromDatasets } from "../util/pipes/getLayerNamePipe.pipe";
import { SortDataEntriesToRegion } from "../util/pipes/sortDataEntriesIntoRegion.pipe";
import { CitationsContainer } from "./citation/citations.component";
import { PluginBannerUI } from "./pluginBanner/pluginBanner.component";

import { ScrollingModule } from "@angular/cdk/scrolling"
import { HttpClientModule } from "@angular/common/http";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { AppendtooltipTextPipe } from "src/util/pipes/appendTooltipText.pipe";
import { FlatmapArrayPipe } from "src/util/pipes/flatMapArray.pipe";
import { GetFileExtension } from "src/util/pipes/getFileExt.pipe";
import { UtilModule } from "src/util";
import { DownloadDirective } from "../util/directives/download.directive";
import { SpatialLandmarksToDataBrowserItemPipe } from "../util/pipes/spatialLandmarksToDatabrowserItem.pipe";
import { ConfigComponent } from './config/config.component'
import { CurrentLayout } from "./config/currentLayout/currentLayout.component";
import { FourPanelLayout } from "./config/layouts/fourPanel/fourPanel.component";
import { HorizontalOneThree } from "./config/layouts/h13/h13.component";
import { SinglePanel } from "./config/layouts/single/single.component";
import { VerticalOneThree } from "./config/layouts/v13/v13.component";
import { CookieAgreement } from "./cookieAgreement/cookieAgreement.component";
import { DatabrowserModule } from "../atlasComponents/databrowserModule/databrowser.module";
import { HelpComponent } from "./help/help.component";
import { KGToS } from "./kgtos/kgtos.component";
import { LogoContainer } from "./logoContainer/logoContainer.component";
import { MobileOverlay } from "./nehubaContainer/mobileOverlay/mobileOverlay.component";
import { MobileControlNubStylePipe } from "./nehubaContainer/pipes/mobileControlNubStyle.pipe";
import { StatusCardComponent } from "./nehubaContainer/statusCard/statusCard.component";
import { SigninBanner } from "./signinBanner/signinBanner.components";

import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { KgSearchBtnColorPipe } from "src/util/pipes/kgSearchBtnColor.pipe";
import { PluginBtnFabColorPipe } from "src/util/pipes/pluginBtnFabColor.pipe";
import { TemplateParcellationHasMoreInfo } from "src/util/pipes/templateParcellationHasMoreInfo.pipe";
import { MaximmisePanelButton } from "./nehubaContainer/maximisePanelButton/maximisePanelButton.component";
import { ReorderPanelIndexPipe } from "./nehubaContainer/reorderPanelIndex.pipe";
import { TouchSideClass } from "./nehubaContainer/touchSideClass.directive";

import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";

import { ShareModule } from "src/share";
import { StateModule } from "src/state";
import { AuthModule } from "src/auth";
import { FabSpeedDialModule } from "src/components/fabSpeedDial";
import { ActionDialog } from "./actionDialog/actionDialog.component";
import { APPEND_SCRIPT_TOKEN, appendScriptFactory } from "src/util/constants";
import { DOCUMENT } from "@angular/common";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RegionAccordionTooltipTextPipe } from './util'
import { HelpOnePager } from "./helpOnePager/helpOnePager.component";
import { RegionalFeaturesModule } from "../atlasComponents/regionalFeatures";
import { Landmark2DModule } from "./nehubaContainer/2dLandmarks/module";
import { PluginCspCtrlCmp } from "./config/pluginCsp/pluginCsp.component";
import { ScreenshotModule, HANDLE_SCREENSHOT_PROMISE, TypeHandleScrnShotPromise } from "./screenshot";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { AtlasCmpUiSelectorsModule } from "src/atlasComponents/uiSelectors";
import { AtlasCmpParcellationModule } from "src/atlasComponents/parcellation";
import { AtlasCmptConnModule } from "src/atlasComponents/connectivity";
import { ViewerModule } from "src/viewerModule";

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
    ViewerModule,
    ShareModule,
    StateModule,
    AuthModule,
    FabSpeedDialModule,
    RegionalFeaturesModule,
    Landmark2DModule,
    ScreenshotModule,
    ParcellationRegionModule,
    AtlasCmpUiSelectorsModule,
    AtlasCmpParcellationModule,
    AtlasCmptConnModule,
  ],
  declarations : [
    NehubaContainer,
    
    SplashScreen,
    PluginBannerUI,
    CitationsContainer,
    LogoContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent,
    SigninBanner,
    PluginCspCtrlCmp,

    StatusCardComponent,
    CookieAgreement,
    KGToS,
    FourPanelLayout,
    HorizontalOneThree,
    VerticalOneThree,
    SinglePanel,
    CurrentLayout,
    MaximmisePanelButton,
    HelpOnePager,

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
    GetTemplateImageSrcPipe,
    ImgSrcSetPipe,
    PluginBtnFabColorPipe,
    KgSearchBtnColorPipe,
    GetFileExtension,

    TemplateParcellationHasMoreInfo,
    HumanReadableFileSizePipe,
    ReorderPanelIndexPipe,
    RegionAccordionTooltipTextPipe,

    /* directive */
    DownloadDirective,
    TouchSideClass,
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
    
    PluginBannerUI,
    ActionDialog,
  ],
  exports : [
    CitationsContainer,
    PluginBannerUI,
    NehubaContainer,
    
    LogoContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent,
    SigninBanner,
    
    CookieAgreement,
    KGToS,
    StatusCardComponent,
    FixedMouseContextualContainerDirective,
  ]
})

export class UIModule {
}
