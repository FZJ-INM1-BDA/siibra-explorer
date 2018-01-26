import { Component,ViewChild ,HostListener,AfterViewInit } from '@angular/core'
import { NehubaUIControl } from './nehubaUI.control.component'
import { UI_CONTROL,MainController } from './nehubaUI.services'
import { WidgetsContainer } from './nehubaUI.widgets.component'
import { NehubaBanner } from 'nehubaUI/nehubaUI.banner.component';

@Component({
  selector : 'div#ATLASContainer',
  template : `
    <div [style.grid-template-columns]="calcGridTemplateColumn()" containerDiv>
      <nehubaModal (fetchedPlugin)="fetchedPlugin($event)" (fetchedSomething)="nehubaUI.fetchedSomething($event)"></nehubaModal>
  
      <div [autoClose]="true" [isOpen]="showMenu" dropdownContainer dropdown container="body">
        <atlasbanner dropdownToggle [ngClass]="{'darktheme':mainController.darktheme}">
        </atlasbanner>
        <ul [ngClass]="{'darktheme':mainController.darktheme}" class="dropdown-menu" role="menu" *dropdownMenu>

          <li class = "dropdown-header">Templates</li>
          <li *ngIf="mainController.loadedTemplates.length == 0" class = "disabled">Still loading templates ... </li>
          <li [ngClass]="{'selected':template == mainController.selectedTemplate}" *ngFor="let template of mainController.loadedTemplates" role="menuitem"><a class="dropdown-item" (click)="mainController.loadTemplate(template)" href="#">{{template.name}}</a></li>
          
          <li class="divider dropdown-divider"></li>

          <li class = "dropdown-header">Parcellations</li>
          <li [ngClass]="{'selected':parcellation == mainController.selectedParcellation}" *ngFor="let parcellation of mainController.selectedTemplate ? mainController.selectedTemplate.parcellations : []" role="menuitem"><a class="dropdown-item" (click)="mainController.loadParcellation(parcellation)" href="#">{{parcellation.name}}</a></li>
          <li role="menuitem" *ngIf="!mainController.selectedTemplate"><i class="text-muted">no template selected</i></li>
          
          <li class="divider dropdown-divider"></li>

          <li class = "dropdown-header">Tools</li>
          <li *ngFor="let widget of mainController.loadedWidgets" role="menuitem"><a (click)="mainController.loadWidget(widget)" class="dropdown-item" href="#">{{widget.name}}</a></li>
        </ul>
      </div>

      <atlascontrol (emitHideUI)="controlUI($event)">
      </atlascontrol>
      <div 
        id = "atlasResizeSliver" 
        (mousedown)="resizeControlPanel=true;enableUIInteraction(false)" 
        (mousemove)="mousemove($event)" 
        (mouseup)="mouseup()">
      </div>
      <ATLASViewer 
        (emitHideUI)="controlUI($event)" 
        [hideUI]="hideUI" 
        id = "ATLASViewer" 
        [ngStyle]="{'grid-column-start': hideUI ? '1' : '3','grid-column-end' : hideUI ? 'span 3' : 'span 1'}">
      </ATLASViewer>
      <div 
        id = "dockResizeSliver" 
        [hidden]="!hasDockedComponents()" 
        (mousedown)="resizeDockedWidgetPanel=true;enableUIInteraction(false)" 
        (mousemove)="mousemove($event)" 
        (mouseup)="mouseup()">
      </div>
      <WidgetsContainer 
        [ngClass]="{'darktheme':darktheme}"
        [style.grid-column-start]="hasDockedComponents() ? '5' : '3'" 
        [hasDockedComponents]="hasDockedComponents()" 
        [dockedWidgetPanelWidth] = "dockedWidgetPanelWidth">
      </WidgetsContainer>
    </div>
  `,
  styles : [
    `
    div[containerDiv]
    {
      height:100%;
      width:100%;
      display:grid;
      grid-template-columns:250px 10px auto;
      grid-template-rows:10% 90%;
    }

    div[dropdownContainer]
    {
      grid-column-start:1;
      grid-column-end:span 1;
      grid-row-start:1;
      grid-row-end:span 1;
    }

    ul li.selected a:before
    {
      content: '\u2022';
      width : 1em;
      margin-left: -1em;
      display:inline-block;
    }

    ul li
    {
      padding-left:0.5em;
    }

    atlasbanner
    {
      width:100%;
      height:100%;
    }

    div#atlasResizeSliver
    {
      grid-column-start:2;
      grid-column-end:span 1;
      grid-row-start:1;
      grid-row-end:span 2;
      z-index:3;
    }
      div#atlasResizeSliver:hover
      {
        cursor:ew-resize;
      }

    atlascontrol
    {
      grid-column-start:1;
      grid-column-end:span 1;
      grid-row-start:2;
      grid-row-end:span 1;
      z-index:2;
    }

    div#dockResizeSliver
    {
      grid-column-start:4;
      grid-column-end:span 1;
      grid-row-start:1;
      grid-row-end:span 2;
      z-index:3;
    }
      div#dockResizeSliver:hover
      {
        cursor:ew-resize;
      }

    WidgetsContainer
    {
      grid-column-start : 5;
      grid-column-end : span 1;
      grid-row-start : 1;
      grid-row-end : span 2;
    }

    ATLASViewer
    {
      grid-column-start:3;
      grid-column-end:span 1;
      grid-row-start:1;
      grid-row-end:span 2;
      z-index:5;
    }
    `
  ],
  host : {
    '[class.darktheme]':'darktheme'
  }
})

export class NehubaContainer implements AfterViewInit {
  showMenu : boolean = false

  hideUI = false
  darktheme = false
  resizeControlPanel = false
  resizeDockedWidgetPanel = false
  controlPanelWidth = 250
  dockedWidgetPanelWidth = 300

  @ViewChild(NehubaUIControl) nehubaUI : NehubaUIControl 
  @ViewChild(WidgetsContainer) widgetContainer : WidgetsContainer
  @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner

  constructor(public mainController:MainController){
    this.darktheme = this.mainController.darktheme
  }
  
  @HostListener('document:mousemove',['$event'])
  mousemove(ev:any){
    if(this.resizeControlPanel){
      this.controlPanelWidth = /*this.startcontrolPanelWidth + this.startpos -*/ ev.clientX
    }
    if(this.resizeDockedWidgetPanel){
      this.dockedWidgetPanelWidth = window.innerWidth - /*this.startcontrolPanelWidth + this.startpos -*/ ev.clientX
    }
  }

  @HostListener('document:mouseup',['$event'])
  mouseup(){
    this.resizeControlPanel = false
    this.resizeDockedWidgetPanel = false
    if(this.mainController.nehubaViewer)this.mainController.nehubaViewer.redraw()
    this.enableUIInteraction(true )
  }

  toggleMenu(){
    this.showMenu = !this.showMenu
  }

  ngAfterViewInit(){
    window.location.hash = ''
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = this.mainController.darktheme
    })
  }

  hasDockedComponents(){
    return this.widgetContainer.dockedWidgetContainer.viewContainerRef ? 
      this.widgetContainer.dockedWidgetContainer.viewContainerRef.length > 0 :
      false
    // return true
  }

  calcGridTemplateColumn(){
    return this.hasDockedComponents() ? 
      `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto 10px ${this.dockedWidgetPanelWidth < 300 ? this.dockedWidgetPanelWidth : 300 }px` :
      `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto`
  }

  controlUI(ev:any){
    this.hideUI = ev.hideUI
  }

  enableUIInteraction(bool:boolean){
    document.body.style.pointerEvents = bool ? 'all':'none'
    document.body.style.userSelect = bool ? 'initial' : 'none'
  }
}