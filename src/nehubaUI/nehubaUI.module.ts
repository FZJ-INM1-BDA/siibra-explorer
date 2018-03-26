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
import { NehubaViewerInnerContainer,NehubaViewerComponent,NehubaViewerOverlayUnit,NehubaLandmarkList,NehubaViewer2DLandmarkUnit } from 'nehubaUI/mainUI/viewer/nehubaUI.viewer.component';
import { NehubaViewerContainer } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerContainer.component';
import { NehubaUIRegionMultilevel } from 'nehubaUI/mainUI/regionMultilevel/nehubaUI.regionMultilevel.component';
import { SplashScreen } from 'nehubaUI/mainUI/splashScreen/splashScreen.component'

/* components */
import { MultilevelSelector } from 'nehubaUI/components/multilevel/nehubaUI.multilevel.component'
import { DatasetBlurb } from 'nehubaUI/components/datasetBlurb/nehubaUI.datasetBlurb.component'
import { Multiform } from 'nehubaUI/components/multiform/nehubaUI.multiform.component';
import { FloatingTooltip } from 'nehubaUI/components/floatingTooltip/nehubaUI.floatingTooltip.component'
import { ReadMoreComponent } from 'nehubaUI/components/readmore/nehubaUI.readmore.component'
import { NehubaModalService,NehubaModalUnit } from 'nehubaUI/components/modal/nehubaUI.modal.component'
import { DynamicViewDirective, DockedWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer, FloatingWidgetView, WidgetView, MinimisedView, MinimisedWidgetContainer } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component'

/* util */
import { IsEmpty,FilterUncertainObject,SelectTreePipe,MultilevelSelectorVisiblePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe, NmToMmPipe, ArrayJoinComma  } from 'nehubaUI/util/nehubaUI.util.pipes'

/* service */
import { MainController,ModalServices, TempReceptorData,LandmarkServices, WidgitServices } from './nehubaUI.services';



import { SearchResultCardRegion,ListSearchResultCardRegion,ListSearchResultCardPill,SearchResultPillRegion } from './nehubaUI.searchResultCard.region'


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
        [ 
        SplashScreen,
        DatasetBlurb, ReadMoreComponent, 
        ListSearchResultCardRegion, SearchResultCardRegion ,NehubaViewer2DLandmarkUnit,ListSearchResultCardPill,SearchResultPillRegion,
        MinimisedView,MinimisedWidgetContainer, DynamicViewDirective, WidgetView,DockedWidgetView,FloatingWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer,NehubaLandmarkList,
        NehubaViewerInnerContainer,NehubaViewerComponent,NehubaViewerOverlayUnit,FloatingTooltip,
        Multiform, NehubaContainer,NehubaViewerContainer,NehubaUIRegionMultilevel,NehubaBanner,NehubaModalUnit,
        MultilevelSelector, NehubaModalService, TempReceptorData,
        IsEmpty,FilterUncertainObject,SearchPipe,SelectTreePipe,MultilevelSelectorVisiblePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe, NmToMmPipe, ArrayJoinComma,SearchPipe,PrependNavigate,MapToValuePipe,UniquefyPipe,ConcatFlattenArrayPipe],
    bootstrap : [ NehubaContainer ],
    providers : [ MainController,LandmarkServices,WidgitServices,ModalServices ],
    entryComponents : [ MinimisedView, WidgetView, DockedWidgetView,FloatingWidgetView, NehubaViewerComponent,NehubaModalUnit ]
})
export class NehubaUI{
    
}

/* TODO: culling uncessary components, such as ActiveComponent */
