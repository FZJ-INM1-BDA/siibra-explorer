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
import { GetUniqueProperty } from "../util/pipes/getUniqueProperty.pipe";
import { FilterDataEntriesbyType } from "../util/pipes/filterDataEntriesByType.pipe";
import { DedicatedViewer } from "./fileviewer/dedicated/dedicated.component";
import { LandmarkUnit } from "./nehubaContainer/landmarkUnit/landmarkUnit.component";
import { SafeStylePipe } from "../util/pipes/safeStyle.pipe";
import { PluginBannerUI } from "./pluginBanner/pluginBanner.component";
import { AtlasBanner } from "./banner/banner.component";
import { PopoverModule } from "ngx-bootstrap/popover";
import { CitationsContainer } from "./citation/citations.component";
import { LayerBrowser } from "./layerbrowser/layerbrowser.component";
import { TooltipModule } from "ngx-bootstrap/tooltip";


@NgModule({
  imports : [
    ChartsModule,
    FormsModule,
    BrowserModule,
    LayoutModule,
    ComponentsModule,

    TooltipModule.forRoot(),
    PopoverModule.forRoot()
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

    /* pipes */
    GroupDatasetByRegion,
    filterRegionDataEntries,
    PathToNestedChildren,
    CopyPropertyPipe,
    GetUniqueProperty,
    FilterDataEntriesbyType,
    SafeStylePipe,
    
  ],
  entryComponents : [

    /* dynamically created components needs to be declared here */
    NehubaViewerUnit,
    FileViewer,
    DataBrowserUI
  ],
  exports : [
    CitationsContainer,
    AtlasBanner,
    PluginBannerUI,
    NehubaContainer,
    NehubaViewerUnit,
    DataBrowserUI,
    LayerBrowser,
    FileViewer
  ]
})

export class UIModule{

}