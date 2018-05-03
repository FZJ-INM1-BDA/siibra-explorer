import { NgModule, Injector } from '@angular/core';
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { createCustomElement } from '@angular/elements'

import { ModalModule }  from 'ngx-bootstrap/modal'
import { ButtonsModule }  from 'ngx-bootstrap/buttons'
import { TabsModule }  from 'ngx-bootstrap/tabs'
import { BsDropdownModule }  from 'ngx-bootstrap/dropdown'
import { PopoverModule }  from 'ngx-bootstrap/popover'
import { TooltipModule } from 'ngx-bootstrap/tooltip'

import { ChartsModule } from 'ng2-charts'

/* mainUI */
import { NehubaContainer } from 'nehubaUI/mainUI/parent/nehubaUI.parent.component';
import { NehubaBanner,SearchPipe,PrependNavigate,MapToValuePipe,/* UniquefyPipe, */ConcatFlattenArrayPipe } from 'nehubaUI/mainUI/banner/nehubaUI.banner.component';
import { NehubaViewerInnerContainer } from 'nehubaUI/mainUI/viewer/nehubaUI.viewer.component'
import { NehubaViewer2DLandmarkUnit } from 'nehubaUI/mainUI/viewer/nehubaUI.viewer.2dlandmark.component'
import { NehubaViewerOverlayUnit } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerOverlay.component'
import { NehubaViewerComponent } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerUnit.component'
import { NehubaViewerContainer } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerContainer.component';
import { NehubaUIRegionMultilevel } from 'nehubaUI/mainUI/regionMultilevel/nehubaUI.regionMultilevel.component';
import { SplashScreen } from 'nehubaUI/mainUI/splashScreen/splashScreen.component'
import { DisplayFilteredResult } from 'nehubaUI/mainUI/displayFilteredResult/nehubaUI.displayFilteredResult.component'
import { SearchResultUI } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component'
import { FileViewer } from 'nehubaUI/mainUI/fileViewer/fileViewer.component'
import { PropertyWidget } from 'nehubaUI/mainUI/propertyWidget/nehubaUI.propertyWidget.component'
import { RegionAnchoredResults } from 'nehubaUI/mainUI/regionAnchoredResults/nehubaUI.regionAnchoredResults.component'
import { SearchResultUIList,SearchResultPaginationPipe,FilterDatasetSearchResult } from 'nehubaUI/mainUI/regionAnchoredResults/nehubaUI.searchResultList.component'
import { SelectedRegionList } from 'nehubaUI/mainUI/regionAnchoredResults/nehubaUI.selectedRegionListResults.component'
import { DedicatedViewController } from 'nehubaUI/mainUI/fileViewer/fileViewerDedicatedView.component'
import { SearchResultUIFileFolders,SearchResultFilesFolderHeirachyPipe,SearchResultFilesFolderZeroHeirachyPipe } from 'nehubaUI/mainUI/searchResultUI/searchResultUIFileFolders.component'

/* components */
import { MultilevelSelector } from 'nehubaUI/components/multilevel/nehubaUI.multilevel.component'
import { DatasetBlurb } from 'nehubaUI/components/datasetBlurb/nehubaUI.datasetBlurb.component'
import { Multiform } from 'nehubaUI/components/multiform/nehubaUI.multiform.component';
import { FloatingTooltip } from 'nehubaUI/components/floatingTooltip/nehubaUI.floatingTooltip.component'
import { ReadMoreComponent } from 'nehubaUI/components/readmore/nehubaUI.readmore.component'
import { NehubaModalService,NehubaModalUnit } from 'nehubaUI/components/modal/nehubaUI.modal.component'
import { DynamicViewDirective, DockedWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer, FloatingWidgetView, WidgetView, MinimisedView, MinimisedWidgetContainer } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component'
import { NehubaRadarChart } from 'nehubaUI/components/chart/radarChart/nehubaUI.radar.chart.component'
import { NehubaLineChart } from 'nehubaUI/components/chart/lineChart/nehubaUI.line.chart.component'
import { CollapsablePanel } from 'nehubaUI/components/collapsablePanel/nehubaUI.collapsablePanel.component'
import { PaginationComponent } from 'nehubaUI/components/pagination/nehubaUI.pagination.component'

/* directive */
import { RenderTemplateDirective } from 'nehubaUI/components/nehubaUI.renderTemplate.directive'

/* util */
import { FilterUncertainObject,SelectTreePipe,MultilevelSelectorVisiblePipe,SearchHighlight,KeyPipe  } from 'nehubaUI/util/nehubaUI.util.pipes'

/* service */
import { MainController,InfoToUIService,LandmarkServices, WidgitServices } from './nehubaUI.services';


@NgModule({
  imports:[
    ChartsModule,
    RouterModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    ButtonsModule.forRoot(),
    ModalModule.forRoot(),
    TabsModule.forRoot(),
    BsDropdownModule.forRoot(),
    PopoverModule.forRoot(),
    TooltipModule.forRoot()
  ],
  declarations : 
    [  FilterDatasetSearchResult,SearchResultUIFileFolders ,SearchResultFilesFolderHeirachyPipe,SearchResultFilesFolderZeroHeirachyPipe,
    DedicatedViewController,SearchResultPaginationPipe,PaginationComponent,
    CollapsablePanel, PropertyWidget,RegionAnchoredResults,SelectedRegionList,
    DisplayFilteredResult, NehubaRadarChart,NehubaLineChart,SearchResultUI,SearchResultUIList,FileViewer,
    SplashScreen,RenderTemplateDirective,
    DatasetBlurb, ReadMoreComponent, 
    NehubaViewer2DLandmarkUnit,
    MinimisedView,MinimisedWidgetContainer, DynamicViewDirective, WidgetView,DockedWidgetView,FloatingWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer,
    NehubaViewerInnerContainer,NehubaViewerComponent,NehubaViewerOverlayUnit,FloatingTooltip,
    Multiform, NehubaContainer,NehubaViewerContainer,NehubaUIRegionMultilevel,NehubaBanner,NehubaModalUnit,
    MultilevelSelector, NehubaModalService,
    FilterUncertainObject,SearchPipe,SelectTreePipe,MultilevelSelectorVisiblePipe,SearchHighlight,KeyPipe,SearchPipe,PrependNavigate,MapToValuePipe,ConcatFlattenArrayPipe],
  bootstrap : [ NehubaContainer ],
  providers : [ MainController,LandmarkServices,WidgitServices,InfoToUIService ],
  entryComponents : [ 
      MinimisedView, 
      WidgetView, 
      DockedWidgetView,
      FloatingWidgetView, 
      NehubaViewerComponent,
      NehubaModalUnit,
      SearchResultUI,
    
      /* exported to be used by plugins etc */
      CollapsablePanel,
      ReadMoreComponent,
      NehubaRadarChart,
      NehubaLineChart ]
})
export class NehubaUI{
  constructor(public injector:Injector){
    const readmoreElement = createCustomElement( ReadMoreComponent, {injector : this.injector })
    const radarChart = createCustomElement( NehubaRadarChart, {injector : this.injector })
    const lineChart = createCustomElement( NehubaLineChart , {injector : this.injector })
    
    customElements.define('readmore-component',readmoreElement)
    customElements.define('radar-chart-component',radarChart)
    customElements.define('line-chart-component',lineChart)
  }
}
