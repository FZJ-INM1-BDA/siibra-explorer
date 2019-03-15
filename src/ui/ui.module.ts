import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { ComponentsModule } from "../components/components.module";

import { NehubaViewerUnit } from "./nehubaContainer/nehubaViewer/nehubaViewer.component";
import { NehubaContainer } from "./nehubaContainer/nehubaContainer.component";
import { SplashScreen } from "./nehubaContainer/splashScreen/splashScreen.component";
import { LayoutModule } from "../layouts/layout.module";
import { FormsModule } from "@angular/forms";
import { DataBrowserUI } from "./databrowser/databrowser.component";
import { GroupDatasetByRegion } from "../util/pipes/groupDataEntriesByRegion.pipe";
import { filterRegionDataEntries } from "../util/pipes/filterRegionDataEntries.pipe";
import { FileViewer } from "./fileviewer/fileviewer.component";

import { ChartsModule } from 'ng2-charts'
import { RadarChart } from "./fileviewer/radar/radar.chart.component";
import { LineChart } from "./fileviewer/line/line.chart.component";
import { PathToNestedChildren } from "../util/pipes/pathToNestedChildren.pipe";
import { CopyPropertyPipe } from "../util/pipes/copyProperty.pipe";
import { GetPropMapPipe } from "../util/pipes/getPropMap.pipe";
import { GetUniquePipe } from "src/util/pipes/getUnique.pipe";

import { FilterDataEntriesbyType } from "../util/pipes/filterDataEntriesByType.pipe";
import { DedicatedViewer } from "./fileviewer/dedicated/dedicated.component";
import { LandmarkUnit } from "./nehubaContainer/landmarkUnit/landmarkUnit.component";
import { SafeStylePipe } from "../util/pipes/safeStyle.pipe";
import { PluginBannerUI } from "./pluginBanner/pluginBanner.component";
import { AtlasBanner } from "./banner/banner.component";
import { CitationsContainer } from "./citation/citations.component";
import { LayerBrowser } from "./layerbrowser/layerbrowser.component";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { KgEntryViewer } from "./kgEntryViewer/kgentry.component";
import { SubjectViewer } from "./kgEntryViewer/subjectViewer/subjectViewer.component";
import { GetLayerNameFromDatasets } from "../util/pipes/getLayerNamePipe.pipe";
import { SortDataEntriesToRegion } from "../util/pipes/sortDataEntriesIntoRegion.pipe";
import { DatasetViewerComponent } from "./datasetViewer/datasetViewer.component";
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
import { FilterDataEntriesByRegion } from "src/util/pipes/filterDataEntriesByRegion.pipe";
import { PopoverModule } from 'ngx-bootstrap/popover'


@NgModule({
  imports : [
    ChartsModule,
    FormsModule,
    BrowserModule,
    LayoutModule,
    ComponentsModule,

    PopoverModule.forRoot(),
    TooltipModule.forRoot()
  ],
  declarations : [
    NehubaContainer,
    NehubaViewerUnit,
    SplashScreen,
    DataBrowserUI,
    FileViewer,
    RadarChart,
    LineChart,
    DedicatedViewer,
    LandmarkUnit,
    AtlasBanner,
    PluginBannerUI,
    CitationsContainer,
    LayerBrowser,
    KgEntryViewer,
    SubjectViewer,
    DatasetViewerComponent,
    LogoContainer,
    TemplateParcellationCitationsContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent,

    /* pipes */
    GroupDatasetByRegion,
    filterRegionDataEntries,
    PathToNestedChildren,
    CopyPropertyPipe,
    GetPropMapPipe,
    GetUniquePipe,
    FlatmapArrayPipe,
    FilterDataEntriesbyType,
    FilterDataEntriesByRegion,
    SafeStylePipe,
    GetLayerNameFromDatasets,
    SortDataEntriesToRegion,
    SpatialLandmarksToDataBrowserItemPipe,
    FilterNullPipe,

    /* directive */
    DownloadDirective,
    ShowToastDirective
  ],
  entryComponents : [

    /* dynamically created components needs to be declared here */
    NehubaViewerUnit,
    FileViewer,
    DataBrowserUI,
    DatasetViewerComponent
  ],
  exports : [
    SubjectViewer,
    KgEntryViewer,
    CitationsContainer,
    AtlasBanner,
    PluginBannerUI,
    NehubaContainer,
    NehubaViewerUnit,
    DataBrowserUI,
    LayerBrowser,
    FileViewer,
    LogoContainer,
    DatasetViewerComponent,
    TemplateParcellationCitationsContainer,
    MobileOverlay,
    HelpComponent,
    ConfigComponent
  ]
})

export class UIModule{

}