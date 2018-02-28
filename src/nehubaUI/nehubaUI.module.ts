import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { ModalModule }  from 'ngx-bootstrap/modal'
import { ButtonsModule }  from 'ngx-bootstrap/buttons'
import { TabsModule }  from 'ngx-bootstrap/tabs'
import { BsDropdownModule }  from 'ngx-bootstrap/dropdown'
import { PopoverModule }  from 'ngx-bootstrap/popover'
import { TooltipModule } from 'ngx-bootstrap/tooltip'

import { DynamicViewDirective, DockedWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer, FloatingWidgetView, WidgetView, MinimisedView, MinimisedWidgetContainer } from './nehubaUI.widgets.component'
import { NehubaModalService,NehubaModalUnit } from './nehubaUI.modal.component'
import { MultilevelSelector } from './nehubaUI.multilevel.component'
import { NehubaUIControl,SearchPipe,PrependNavigate,HighlighPipe } from './nehubaUI.control.component';
import { NehubaViewerContainer } from './nehubaUI.viewerContainer.component';
import { NehubaViewerInnerContainer,NehubaViewerDirective,NehubaViewerComponent,NehubaViewerOverlayUnit,NehubaLandmarkList } from './nehubaUI.viewer.component';
import { NehubaContainer } from './nehubaUI.parent.component';
import { NehubaBanner } from './nehubaUI.banner.component';
import { FloatingPopOver } from './nehubaUI.floatingPopover.component'
import { Multiform,ActiveComponent } from './nehubaUI.displaymultiform.component';
import { MainController, TempReceptorData } from './nehubaUI.services';
import { IsEmpty,FilterUncertainObject,SelectTreePipe,SearchTreePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe, NmToMmPipe, ArrayJoinComma, MultilevelHasVisibleChildren  } from './nehubaUI.util.pipes'

@NgModule({
    imports:[
        RouterModule,
        FormsModule,
        BrowserModule,
        ButtonsModule.forRoot(),
        ModalModule.forRoot(),
        TabsModule.forRoot(),
        BsDropdownModule.forRoot(),
        PopoverModule.forRoot(),
        TooltipModule.forRoot()
    ],
    declarations : 
        [ MinimisedView,MinimisedWidgetContainer, DynamicViewDirective, WidgetView,DockedWidgetView,FloatingWidgetView,WidgetsContainer,FloatingWidgetContainer,DockedWidgetContainer,NehubaLandmarkList,
        NehubaViewerInnerContainer,NehubaViewerDirective,NehubaViewerComponent,NehubaViewerOverlayUnit,FloatingPopOver,
        Multiform,ActiveComponent, NehubaContainer,NehubaViewerContainer,NehubaUIControl,NehubaBanner,NehubaModalUnit,
        MultilevelSelector, NehubaModalService, TempReceptorData,
        IsEmpty,FilterUncertainObject,SearchPipe,SelectTreePipe,SearchTreePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe, NmToMmPipe, ArrayJoinComma,MultilevelHasVisibleChildren,SearchPipe,PrependNavigate,HighlighPipe],
    bootstrap : [ NehubaContainer ],
    providers : [ MainController ],
    entryComponents : [ MinimisedView, WidgetView, DockedWidgetView,FloatingWidgetView, NehubaViewerComponent,NehubaModalUnit ]
})
export class NehubaUI{
    
}

/* TODO: culling uncessary components, such as ActiveComponent */