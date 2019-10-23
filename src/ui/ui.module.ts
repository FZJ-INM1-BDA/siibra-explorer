import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components/components.module";

import { NehubaViewerUnit } from "./nehubaContainer/nehubaViewer/nehubaViewer.component";
import { NehubaContainer } from "./nehubaContainer/nehubaContainer.component";
import { SplashScreen, GetTemplateImageSrcPipe, ImgSrcSetPipe } from "./nehubaContainer/splashScreen/splashScreen.component";
import { LayoutModule } from "src/layouts/layout.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { GroupDatasetByRegion } from "src/util/pipes/groupDataEntriesByRegion.pipe";
import { filterRegionDataEntries } from "src/util/pipes/filterRegionDataEntries.pipe";

import { GetUniquePipe } from "src/util/pipes/getUnique.pipe";

import { LandmarkUnit } from "./nehubaContainer/landmarkUnit/landmarkUnit.component";
import { SafeStylePipe } from "../util/pipes/safeStyle.pipe";
import { PluginBannerUI } from "./pluginBanner/pluginBanner.component";
import { CitationsContainer } from "./citation/citations.component";
import { LayerBrowser, LockedLayerBtnClsPipe } from "./layerbrowser/layerbrowser.component";
import { KgEntryViewer } from "./kgEntryViewer/kgentry.component";
import { SubjectViewer } from "./kgEntryViewer/subjectViewer/subjectViewer.component";
import { GetLayerNameFromDatasets } from "../util/pipes/getLayerNamePipe.pipe";
import { SortDataEntriesToRegion } from "../util/pipes/sortDataEntriesIntoRegion.pipe";

import { SpatialLandmarksToDataBrowserItemPipe } from "../util/pipes/spatialLandmarksToDatabrowserItem.pipe";
import { DownloadDirective } from "../util/directives/download.directive";
import { LogoContainer } from "./logoContainer/logoContainer.component";
import { TemplateParcellationCitationsContainer } from "./templateParcellationCitations/templateParcellationCitations.component";
import { MobileOverlay } from "./nehubaContainer/mobileOverlay/mobileOverlay.component";
import { HelpComponent } from "./help/help.component";
import { ConfigComponent } from './config/config.component'
import { FlatmapArrayPipe } from "src/util/pipes/flatMapArray.pipe";
import { DatabrowserModule } from "./databrowserModule/databrowser.module";
import { SigninBanner } from "./signinBanner/signinBanner.components";
import { SigninModal } from "./signinModal/signinModal.component";
import { UtilModule } from "src/util/util.module";
import { FilterNameBySearch } from "./viewerStateController/regionHierachy/filterNameBySearch.pipe";
import { StatusCardComponent } from "./nehubaContainer/statusCard/statusCard.component";
import { CookieAgreement } from "./cookieAgreement/cookieAgreement.component";
import { KGToS } from "./kgtos/kgtos.component";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { AppendtooltipTextPipe } from "src/util/pipes/appendTooltipText.pipe";
import { FourPanelLayout } from "./config/layouts/fourPanel/fourPanel.component";
import { HorizontalOneThree } from "./config/layouts/h13/h13.component";
import { VerticalOneThree } from "./config/layouts/v13/v13.component";
import { SinglePanel } from "./config/layouts/single/single.component";
import { CurrentLayout } from "./config/currentLayout/currentLayout.component";
import { MobileControlNubStylePipe } from "./nehubaContainer/pipes/mobileControlNubStyle.pipe";
import { ScrollingModule } from "@angular/cdk/scrolling"
import { HttpClientModule } from "@angular/common/http";
import { GetFilenamePipe } from "src/util/pipes/getFilename.pipe";
import { GetFileExtension } from "src/util/pipes/getFileExt.pipe";

import { ViewerStateController } from 'src/ui/viewerStateController/viewerStateCFull/viewerState.component'
import { ViewerStateMini } from 'src/ui/viewerStateController/viewerStateCMini/viewerStateMini.component'

import { BinSavedRegionsSelectionPipe, SavedRegionsSelectionBtnDisabledPipe } from "./viewerStateController/viewerState.pipes";
import { PluginBtnFabColorPipe } from "src/util/pipes/pluginBtnFabColor.pipe";
import { KgSearchBtnColorPipe } from "src/util/pipes/kgSearchBtnColor.pipe";
import { TemplateParcellationHasMoreInfo } from "src/util/pipes/templateParcellationHasMoreInfo.pipe";
import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { MaximmisePanelButton } from "./nehubaContainer/maximisePanelButton/maximisePanelButton.component";
import { TouchSideClass } from "./nehubaContainer/touchSideClass.directive";
import { ReorderPanelIndexPipe } from "./nehubaContainer/reorderPanelIndex.pipe";

import {ElementOutClickDirective} from "src/util/directives/elementOutClick.directive";
import {FilterWithStringPipe} from "src/util/pipes/filterWithString.pipe";
import { SearchSideNav } from "./searchSideNav/searchSideNav.component";

import { RegionHierarchy } from './viewerStateController/regionHierachy/regionHierarchy.component'
import { CurrentlySelectedRegions } from './viewerStateController/regionsListView/currentlySelectedRegions/currentlySelectedRegions.component'
import { RegionTextSearchAutocomplete } from "./viewerStateController/regionSearch/regionSearch.component";
import { RegionsListView } from "./viewerStateController/regionsListView/simpleRegionsListView/regionListView.component";
import {TakeScreenshotComponent} from "src/ui/takeScreenshot/takeScreenshot.component";
import {RegionToolsMenuComponent} from "src/ui/regionToolsMenu/regionToolsMenu.component";
import {FixedMouseContextualContainerDirective} from "src/util/directives/FixedMouseContextualContainerDirective.directive";

@NgModule({
  imports : [
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    ComponentsModule,
    DatabrowserModule,
    UtilModule,
    ScrollingModule,
    AngularMaterialModule,
  ],
  declarations : [
    NehubaContainer,
    NehubaViewerUnit,
    SplashScreen,
    LandmarkUnit,
    PluginBannerUI,
    CitationsContainer,
    LayerBrowser,
    KgEntryViewer,
    SubjectViewer,
    LogoContainer,
    TemplateParcellationCitationsContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent,
    SigninBanner,
    SigninModal,
    StatusCardComponent,
    CookieAgreement,
    KGToS,
    FourPanelLayout,
    HorizontalOneThree,
    VerticalOneThree,
    SinglePanel,
    CurrentLayout,
    ViewerStateController,
    ViewerStateMini,
    RegionHierarchy,
    CurrentlySelectedRegions,
    MaximmisePanelButton,
    SearchSideNav,
    RegionTextSearchAutocomplete,
    RegionsListView,
    TakeScreenshotComponent,
    RegionToolsMenuComponent,

    /* pipes */
    GroupDatasetByRegion,
    filterRegionDataEntries,
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
    LockedLayerBtnClsPipe,
    GetFilenamePipe,
    GetFileExtension,
    BinSavedRegionsSelectionPipe,
    SavedRegionsSelectionBtnDisabledPipe,
    FilterWithStringPipe,
    TemplateParcellationHasMoreInfo,
    HumanReadableFileSizePipe,
    ReorderPanelIndexPipe,


    /* directive */
    DownloadDirective,
    TouchSideClass,
    ElementOutClickDirective,
    FixedMouseContextualContainerDirective
  ],
  entryComponents : [

    /* dynamically created components needs to be declared here */
    NehubaViewerUnit,
    LayerBrowser,
    PluginBannerUI,
  ],
  exports : [
    SubjectViewer,
    KgEntryViewer,
    CitationsContainer,
    PluginBannerUI,
    NehubaContainer,
    NehubaViewerUnit,
    LayerBrowser,
    LogoContainer,
    TemplateParcellationCitationsContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent,
    SigninBanner,
    SigninModal,
    CookieAgreement,
    KGToS,
    StatusCardComponent,
    ElementOutClickDirective,
    SearchSideNav,
    ViewerStateMini,
    RegionToolsMenuComponent
  ]
})

export class UIModule{
}
