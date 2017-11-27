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

import { FloatingWidget,FloatingWidgetComponent,FloatingWidgetDirective } from './nehubaUI.floatingWidget.component';
import { NehubaModalService,NehubaModalUnit } from './nehubaUI.modal.component'
import { MultilevelSelector } from './nehubaUI.multilevel.component'
import { NehubaUIControl } from './nehubaUI.control.component';
import { NehubaViewerContainer } from './nehubaUI.viewerContainer.component';
import { NehubaViewerInnerContainer,NehubaViewerDirective,NehubaViewerComponent } from './nehubaUI.viewer.component';
import { NehubaContainer } from './nehubaUI.parent.component';
import { NehubaBanner } from './nehubaUI.banner.component';
import { Lab } from './nehubaUI.lab.component';
import { FloatingPopOver } from './nehubaUI.floatingPopover.component'
import { Multiform,ActiveComponent } from './nehubaUI.displaymultiform.component';
import { HelperFunctions,DataService } from './nehubaUI.services';
import { IsEmpty,FilterUncertainObject,SearchPipe,SelectTreePipe,SearchTreePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe } from './nehubaUI.util.pipes'

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
        [ FloatingWidget, FloatingWidgetComponent, FloatingWidgetDirective,
        NehubaViewerInnerContainer,NehubaViewerDirective,NehubaViewerComponent,FloatingPopOver,
        Multiform,ActiveComponent, Lab,NehubaContainer,NehubaViewerContainer,NehubaUIControl,NehubaBanner,NehubaModalUnit,
        MultilevelSelector, NehubaModalService,
        IsEmpty,FilterUncertainObject,SearchPipe,SelectTreePipe,SearchTreePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe ],
    bootstrap : [ NehubaContainer ],
    providers : [ HelperFunctions,DataService],
    entryComponents : [ FloatingWidgetComponent,NehubaViewerComponent,NehubaModalUnit ]
})
export class NehubaUI{
    
}

/* TODO: culling uncessary components, such as ActiveComponent */