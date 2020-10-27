import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { ComponentsModule } from "src/components/components.module";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LayoutModule } from "src/layouts/layout.module";
import { NehubaContainer } from "./nehubaContainer/nehubaContainer.component";
import { IMPORT_NEHUBA_INJECT_TOKEN } from "./nehubaContainer/nehubaViewer/nehubaViewer.component";
import { GetTemplateImageSrcPipe, ImgSrcSetPipe, SplashScreen } from "./nehubaContainer/splashScreen/splashScreen.component";

import { FilterRegionDataEntries } from "src/util/pipes/filterRegionDataEntries.pipe";
import { GroupDatasetByRegion } from "src/util/pipes/groupDataEntriesByRegion.pipe";

import { GetUniquePipe } from "src/util/pipes/getUnique.pipe";

import { GetLayerNameFromDatasets } from "../util/pipes/getLayerNamePipe.pipe";
import { SafeStylePipe } from "../util/pipes/safeStyle.pipe";
import { SortDataEntriesToRegion } from "../util/pipes/sortDataEntriesIntoRegion.pipe";
import { CitationsContainer } from "./citation/citations.component";
import { KgEntryViewer } from "./kgEntryViewer/kgentry.component";
import { SubjectViewer } from "./kgEntryViewer/subjectViewer/subjectViewer.component";
import { LandmarkUnit } from "./nehubaContainer/landmarkUnit/landmarkUnit.component";
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
import { DatabrowserModule } from "./databrowserModule/databrowser.module";
import { HelpComponent } from "./help/help.component";
import { KGToS } from "./kgtos/kgtos.component";
import { LogoContainer } from "./logoContainer/logoContainer.component";
import { MobileOverlay } from "./nehubaContainer/mobileOverlay/mobileOverlay.component";
import { MobileControlNubStylePipe } from "./nehubaContainer/pipes/mobileControlNubStyle.pipe";
import { StatusCardComponent } from "./nehubaContainer/statusCard/statusCard.component";
import { SigninBanner } from "./signinBanner/signinBanner.components";

import { TemplateParcellationCitationsContainer } from "./templateParcellationCitations/templateParcellationCitations.component";
import { FilterNameBySearch } from "./viewerStateController/regionHierachy/filterNameBySearch.pipe";

import { ViewerStateMini } from 'src/ui/viewerStateController/viewerStateCMini/viewerStateMini.component'

import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { KgSearchBtnColorPipe } from "src/util/pipes/kgSearchBtnColor.pipe";
import { PluginBtnFabColorPipe } from "src/util/pipes/pluginBtnFabColor.pipe";
import { TemplateParcellationHasMoreInfo } from "src/util/pipes/templateParcellationHasMoreInfo.pipe";
import { MaximmisePanelButton } from "./nehubaContainer/maximisePanelButton/maximisePanelButton.component";
import { ReorderPanelIndexPipe } from "./nehubaContainer/reorderPanelIndex.pipe";
import { TouchSideClass } from "./nehubaContainer/touchSideClass.directive";
import { BinSavedRegionsSelectionPipe, SavedRegionsSelectionBtnDisabledPipe } from "./viewerStateController/viewerState.pipes";

import { TakeScreenshotComponent } from "src/ui/takeScreenshot/takeScreenshot.component";
import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import { RegionHierarchy } from './viewerStateController/regionHierachy/regionHierarchy.component'
import { RegionTextSearchAutocomplete } from "./viewerStateController/regionSearch/regionSearch.component";

import { ConnectivityBrowserComponent } from "src/ui/connectivityBrowser/connectivityBrowser.component";
import { RegionMenuComponent } from 'src/ui/parcellationRegion/regionMenu/regionMenu.component'
import { RegionListSimpleViewComponent } from "./parcellationRegion/regionListSimpleView/regionListSimpleView.component";
import { SimpleRegionComponent } from "./parcellationRegion/regionSimple/regionSimple.component";
import { LandmarkUIComponent } from "./landmarkUI/landmarkUI.component";
import { NehubaModule } from "./nehubaContainer/nehuba.module";
import { ShareModule } from "src/share";
import { StateModule } from "src/state";
import { AuthModule } from "src/auth";
import { FabSpeedDialModule } from "src/components/fabSpeedDial";
import { ActionDialog } from "./actionDialog/actionDialog.component";
import { NehubaViewerTouchDirective } from "./nehubaContainer/nehubaViewerInterface/nehubaViewerTouch.directive";
import { importNehubaFactory } from "./nehubaContainer/util";
import { APPEND_SCRIPT_TOKEN, appendScriptFactory } from "src/util/constants";
import { DOCUMENT } from "@angular/common";
import { AtlasDropdownSelector } from './atlasDropdown/atlasDropdown.component'
import { AtlasLayerSelector } from "src/ui/atlasLayerSelector/atlasLayerSelector.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RegionDirective } from "./parcellationRegion/region.directive";
import { RenderViewOriginDatasetLabelPipe } from "./parcellationRegion/region.base";
import { RegionAccordionTooltipTextPipe } from './util'
import { HelpOnePager } from "./helpOnePager/helpOnePager.component";

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
    NehubaModule,
    ShareModule,
    StateModule,
    AuthModule,
    FabSpeedDialModule,
  ],
  declarations : [
    NehubaContainer,
    
    SplashScreen,
    LandmarkUnit,
    PluginBannerUI,
    CitationsContainer,
    KgEntryViewer,
    SubjectViewer,
    LogoContainer,
    TemplateParcellationCitationsContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent,
    SigninBanner,
    AtlasDropdownSelector,
    AtlasLayerSelector,
    AtlasDropdownSelector,

    StatusCardComponent,
    CookieAgreement,
    KGToS,
    FourPanelLayout,
    HorizontalOneThree,
    VerticalOneThree,
    SinglePanel,
    CurrentLayout,
    ViewerStateMini,
    RegionHierarchy,
    MaximmisePanelButton,
    RegionTextSearchAutocomplete,
    TakeScreenshotComponent,
    RegionMenuComponent,
    ConnectivityBrowserComponent,
    SimpleRegionComponent,
    RegionListSimpleViewComponent,
    LandmarkUIComponent,
    HelpOnePager,

    ActionDialog,

    /* pipes */
    GroupDatasetByRegion,
    FilterRegionDataEntries,
    GetUniquePipe,
    FlatmapArrayPipe,
    SafeStylePipe,
    GetLayerNameFromDatasets,
    SortDataEntriesToRegion,
    SpatialLandmarksToDataBrowserItemPipe,
    FilterNameBySearch,
    AppendtooltipTextPipe,
    MobileControlNubStylePipe,
    GetTemplateImageSrcPipe,
    ImgSrcSetPipe,
    PluginBtnFabColorPipe,
    KgSearchBtnColorPipe,
    GetFileExtension,
    BinSavedRegionsSelectionPipe,
    SavedRegionsSelectionBtnDisabledPipe,

    TemplateParcellationHasMoreInfo,
    HumanReadableFileSizePipe,
    ReorderPanelIndexPipe,
    RenderViewOriginDatasetLabelPipe,
    RegionAccordionTooltipTextPipe,

    /* directive */
    DownloadDirective,
    TouchSideClass,
    FixedMouseContextualContainerDirective,
    NehubaViewerTouchDirective,
    RegionDirective
  ],
  providers: [
    {
      provide: IMPORT_NEHUBA_INJECT_TOKEN,
      useFactory: importNehubaFactory,
      deps: [ APPEND_SCRIPT_TOKEN ]
    },
    {
      provide: APPEND_SCRIPT_TOKEN,
      useFactory: appendScriptFactory,
      deps: [ DOCUMENT ]
    }
  ],
  entryComponents : [

    /* dynamically created components needs to be declared here */
    
    PluginBannerUI,
    ActionDialog,
  ],
  exports : [
    SubjectViewer,
    KgEntryViewer,
    CitationsContainer,
    PluginBannerUI,
    NehubaContainer,
    
    LogoContainer,
    TemplateParcellationCitationsContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent,
    SigninBanner,
    AtlasLayerSelector,
    RegionDirective,
    
    CookieAgreement,
    KGToS,
    StatusCardComponent,
    ViewerStateMini,
    RegionMenuComponent,
    FixedMouseContextualContainerDirective,
    LandmarkUIComponent,
    NehubaViewerTouchDirective,
    AtlasDropdownSelector,
    RenderViewOriginDatasetLabelPipe,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})

export class UIModule {
}
