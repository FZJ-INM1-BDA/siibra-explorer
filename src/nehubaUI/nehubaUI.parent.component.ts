import { Component,ViewChild ,HostListener,AfterViewInit,Renderer2 } from '@angular/core'
import { NehubaUIControl } from './nehubaUI.control.component'
import { UI_CONTROL,MainController,EXTERNAL_CONTROL as gExternalControl, SUPPORTED_LIB, SUPPORT_LIBRARY_MAP } from './nehubaUI.services'
import { WidgetsContainer } from './nehubaUI.widgets.component'
import { NehubaBanner } from 'nehubaUI/nehubaUI.banner.component';

@Component({
  selector : 'div#ATLASContainer',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.parent.template.html',
  styles : [
    `
    div[containerDiv]
    {
      height:100%;
      width:100%;
      display:grid;
      grid-template-columns:250px 10px auto 0px 0px;
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
      z-index:5;
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
    }

    div#dockResizeSliver
    {
      grid-column-start:4;
      grid-column-end:span 1;
      grid-row-start:1;
      grid-row-end:span 2;

      z-index:6;
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
      position:relative;
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



  libraryLoaded : Map<SUPPORTED_LIB,boolean> = new Map()

  @ViewChild(NehubaUIControl) nehubaUI : NehubaUIControl 
  @ViewChild(WidgetsContainer) widgetContainer : WidgetsContainer
  @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner

  constructor(public mainController:MainController, private rd2:Renderer2){
    this.darktheme = this.mainController.darktheme
    gExternalControl.loadExternalLibrary = (libraryNames,callback) =>{
      Promise.all(
        libraryNames.map(libraryName=>
          new Promise((resolve,reject)=>{
            if(this.libraryLoaded.get(libraryName)) return resolve()

            const elScripts = SUPPORT_LIBRARY_MAP.get(libraryName)
            if(!elScripts) return reject(`library name ${libraryName} not defined`)

            Promise.all(elScripts.map(script=>new Promise((rs,rj)=>{
              script.onload = () => rs()
              script.onerror =(e) => rj(e)
              this.rd2.appendChild(document.head,script)
            })))
              .then(()=>resolve())
              .catch(e=>reject(e))
          })))
        .then(()=>callback(null))
        .catch(e=>callback(e))
    }
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
      `${this.controlPanelWidth<150?150:this.controlPanelWidth>450?450:this.controlPanelWidth}px 10px auto 0px 0px`
  }

  controlUI(ev:any){
    this.hideUI = ev.hideUI
  }

  enableUIInteraction(bool:boolean){
    document.body.style.pointerEvents = bool ? 'all':'none'
    document.body.style.userSelect = bool ? 'initial' : 'none'
  }
}