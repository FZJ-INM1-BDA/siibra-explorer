import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { ModalModule }  from 'ngx-bootstrap/modal'
import { ButtonsModule }  from 'ngx-bootstrap/buttons'
import { TabsModule }  from 'ngx-bootstrap/tabs'
import { BsDropdownModule }  from 'ngx-bootstrap/dropdown'
import { PopoverModule }  from 'ngx-bootstrap/popover'
import { TooltipModule } from 'ngx-bootstrap/tooltip'

/* mainUI */
import { NehubaContainer } from 'nehubaUI/mainUI/parent/nehubaUI.parent.component';
import { NehubaBanner,SearchPipe,PrependNavigate,MapToValuePipe,UniquefyPipe,ConcatFlattenArrayPipe } from 'nehubaUI/mainUI/banner/nehubaUI.banner.component';
import { NehubaViewerInnerContainer } from 'nehubaUI/mainUI/viewer/nehubaUI.viewer.component'
import { NehubaViewer2DLandmarkUnit } from 'nehubaUI/mainUI/viewer/nehubaUI.viewer.2dlandmark.component'
import { NehubaViewerOverlayUnit } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerOverlay.component'
import { NehubaViewerComponent } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerUnit.component'
import { NehubaViewerContainer } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerContainer.component';
import { NehubaUIRegionMultilevel } from 'nehubaUI/mainUI/regionMultilevel/nehubaUI.regionMultilevel.component';
import { SplashScreen } from 'nehubaUI/mainUI/splashScreen/splashScreen.component'
import { DisplayFilteredResult } from 'nehubaUI/mainUI/displayFilteredResult/nehubaUI.displayFilteredResult.component'

/* components */
import { MultilevelSelector } from 'nehubaUI/components/multilevel/nehubaUI.multilevel.component'
import { DatasetBlurb } from 'nehubaUI/components/datasetBlurb/nehubaUI.datasetBlurb.component'
import { Multiform } from 'nehubaUI/components/multiform/nehubaUI.multiform.component';
import { FloatingTooltip } from 'nehubaUI/components/floatingTooltip/nehubaUI.floatingTooltip.component'
import { ReadMoreComponent } from 'nehubaUI/components/readmore/nehubaUI.readmore.component'
import { NehubaModalService,NehubaModalUnit } from 'nehubaUI/components/modal/nehubaUI.modal.component'
import { DynamicViewDirective, DockedWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer, FloatingWidgetView, WidgetView, MinimisedView, MinimisedWidgetContainer } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component'

/* directive */
import { RenderTemplateDirective } from 'nehubaUI/components/nehubaUI.renderTemplate.directive'

/* util */
import { FilterUncertainObject,SelectTreePipe,MultilevelSelectorVisiblePipe,SearchHighlight,KeyPipe  } from 'nehubaUI/util/nehubaUI.util.pipes'

/* service */
import { MainController,InfoToUIService, TempReceptorData,LandmarkServices, WidgitServices } from './nehubaUI.services';



import { NehubaLandmarkList,SearchResultCardRegion,ListSearchResultCardRegion,ListSearchResultCardPill,SearchResultPillRegion } from './nehubaUI.searchResultCard.region'


@NgModule({
  imports:[
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
    [ DisplayFilteredResult,
    SplashScreen,RenderTemplateDirective,
    DatasetBlurb, ReadMoreComponent, 
    ListSearchResultCardRegion, SearchResultCardRegion ,NehubaViewer2DLandmarkUnit,ListSearchResultCardPill,SearchResultPillRegion,
    MinimisedView,MinimisedWidgetContainer, DynamicViewDirective, WidgetView,DockedWidgetView,FloatingWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer,NehubaLandmarkList,
    NehubaViewerInnerContainer,NehubaViewerComponent,NehubaViewerOverlayUnit,FloatingTooltip,
    Multiform, NehubaContainer,NehubaViewerContainer,NehubaUIRegionMultilevel,NehubaBanner,NehubaModalUnit,
    MultilevelSelector, NehubaModalService, TempReceptorData,
    FilterUncertainObject,SearchPipe,SelectTreePipe,MultilevelSelectorVisiblePipe,SearchHighlight,KeyPipe,SearchPipe,PrependNavigate,MapToValuePipe,UniquefyPipe,ConcatFlattenArrayPipe],
  bootstrap : [ NehubaContainer ],
  providers : [ MainController,LandmarkServices,WidgitServices,InfoToUIService ],
  entryComponents : [ MinimisedView, WidgetView, DockedWidgetView,FloatingWidgetView, NehubaViewerComponent,NehubaModalUnit ]
})
export class NehubaUI{
  
}

/* TODO: culling uncessary components, such as ActiveComponent */
