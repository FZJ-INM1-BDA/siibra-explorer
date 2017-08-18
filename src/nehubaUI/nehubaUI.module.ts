import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout'

import { PopoverModule }  from 'ngx-bootstrap/popover'
import { ModalModule }  from 'ngx-bootstrap/modal'
import { ButtonsModule }  from 'ngx-bootstrap/buttons'
import { TabsModule }  from 'ngx-bootstrap/tabs'
import { BsDropdownModule }  from 'ngx-bootstrap/dropdown'
// import { CollapseModule }  from 'ngx-bootstrap/collapse'

import { FloatingWidget,FloatingWidgetComponent,FloatingWidgetDirective } from './nehubaUI.floatingWidget.component';
import { NehubaModal } from './nehubaUI.modal.component'
import { MultilevelSelector } from './nehubaUI.multilevel.component'
import { NehubaUIControl } from './nehubaUI.control.component';
import { NehubaViewerContainer } from './nehubaUI.viewerContainer.component';
import { NehubaViewerInnerContainer,NehubaViewerDirective,NehubaViewerComponent } from './nehubaUI.viewer.component';
import { NehubaContainer } from './nehubaUI.parent.component';
import { NehubaBanner } from './nehubaUI.banner.component';
import { Lab } from './nehubaUI.lab.component';
import { Multiform } from './nehubaUI.displaymultiform.component';
import { NehubaFetchData,EventCenter } from './nehubaUI.services';
import { FilterUncertainObject,SearchPipe,SelectTreePipe,SearchTreePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe } from './nehubaUI.util.pipes'

@NgModule({
    imports:[
        FlexLayoutModule,
        BrowserAnimationsModule,
        RouterModule,
        FormsModule,
        BrowserModule,
        ButtonsModule.forRoot(),
        PopoverModule.forRoot(),
        ModalModule.forRoot(),
        TabsModule.forRoot(),
        BsDropdownModule.forRoot()
    ],
    declarations : 
        [ FloatingWidget, FloatingWidgetComponent, FloatingWidgetDirective,
        NehubaViewerInnerContainer,NehubaViewerDirective,NehubaViewerComponent,
        Multiform, Lab,NehubaContainer,NehubaViewerContainer,NehubaUIControl,NehubaBanner,
        MultilevelSelector, NehubaModal,
        FilterUncertainObject,SearchPipe,SelectTreePipe,SearchTreePipe,SearchHighlight,KeyPipe,JsonParsePipe,JsonStringifyPipe ],
    bootstrap : [ NehubaContainer ],
    providers : [ NehubaFetchData,NehubaModal,EventCenter ],
    entryComponents : [ FloatingWidgetComponent,NehubaViewerComponent ]
})
export class NehubaUI{
    
}