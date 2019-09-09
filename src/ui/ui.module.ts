import { NgModule } from "@angular/core";
import { ComponentsModule } from "../components/components.module";

import { NehubaViewerUnit } from "./nehubaContainer/nehubaViewer/nehubaViewer.component";
import { NehubaContainer } from "./nehubaContainer/nehubaContainer.component";
import { SplashScreen, GetTemplateImageSrcPipe, ImgSrcSetPipe } from "./nehubaContainer/splashScreen/splashScreen.component";
import { LayoutModule } from "../layouts/layout.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { GroupDatasetByRegion } from "../util/pipes/groupDataEntriesByRegion.pipe";
import { filterRegionDataEntries } from "../util/pipes/filterRegionDataEntries.pipe";
import { MenuIconsBar } from './menuicons/menuicons.component'

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
import { FilterNullPipe } from "../util/pipes/filterNull.pipe";
import { ShowToastDirective } from "../util/directives/showToast.directive";
import { HelpComponent } from "./help/help.component";
import { ConfigComponent } from './config/config.component'
import { FlatmapArrayPipe } from "src/util/pipes/flatMapArray.pipe";
import { DatabrowserModule } from "./databrowserModule/databrowser.module";
import { SigninBanner } from "./signinBanner/signinBanner.components";
import { SigninModal } from "./signinModal/signinModal.component";
import { UtilModule } from "src/util/util.module";
import { RegionHierarchy } from "./viewerStateController/regionHierachy/regionHierarchy.component";
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
import { ViewerStateController } from "./viewerStateController/viewerState.component";
import { BinSavedRegionsSelectionPipe, SavedRegionsSelectionBtnDisabledPipe } from "./viewerStateController/viewerState.pipes";
import { RegionTextSearchAutocomplete } from "./viewerStateController/regionSearch/regionSearch.component";
import { PluginBtnFabColorPipe } from "src/util/pipes/pluginBtnFabColor.pipe";
import { KgSearchBtnColorPipe } from "src/util/pipes/kgSearchBtnColor.pipe";
import { TemplateParcellationHasMoreInfo } from "src/util/pipes/templateParcellationHasMoreInfo.pipe";
import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";

import {SearchPanel} from "src/ui/searchPanel/searchPanel.component";
import {ElementOutClickDirective} from "src/util/directives/elementOutClick.directive";
import {SearchItemPreviewComponent} from "src/ui/searchItemPreview/searchItemPreview.component";
import {SelectedRegionsComponent} from "src/ui/selectedRegions/selectedRegions.component";
import {FilterWithStringPipe} from "src/util/pipes/filterWithString.pipe";

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
    MenuIconsBar,
    SigninBanner,
    SigninModal,
    RegionHierarchy,
    StatusCardComponent,
    CookieAgreement,
    KGToS,
    FourPanelLayout,
    HorizontalOneThree,
    VerticalOneThree,
    SinglePanel,
    CurrentLayout,
    ViewerStateController,
    RegionTextSearchAutocomplete,
    SearchPanel,
    SearchItemPreviewComponent,
    SelectedRegionsComponent,

    /* pipes */
    GroupDatasetByRegion,
    filterRegionDataEntries,
    GetUniquePipe,
    FlatmapArrayPipe,
    SafeStylePipe,
    GetLayerNameFromDatasets,
    SortDataEntriesToRegion,
    SpatialLandmarksToDataBrowserItemPipe,
    FilterNullPipe,
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

    /* directive */
    DownloadDirective,
    ShowToastDirective,
    ElementOutClickDirective
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
    MenuIconsBar,
    SigninBanner,
    SigninModal,
    CookieAgreement,
    KGToS,
    StatusCardComponent,
    SearchPanel,
    ElementOutClickDirective
  ]
})

export class UIModule{
}
