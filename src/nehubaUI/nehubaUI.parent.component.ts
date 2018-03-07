import { HostListener,Component,ViewChild ,AfterViewInit,Renderer2 } from '@angular/core'
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
      grid-template-columns:auto 0px 0px;
      grid-template-rows:100%;
    }

    atlasbanner[overlayBanner]
    {
      grid-column-start:1;
      grid-column-end:span 1;
      grid-row-start:1;
      grid-row-end:span 1;

      height:2em;
      z-index:6;
    }

    atlascontrol
    {
      position:absolute;
      top : 7em;
      left : 2em;
      width : 20em;
      height : calc(100% - 10em);
      z-index:6;
      overflow:hidden;
    }
    div#dockResizeSliver
    {
      grid-column-start:2;
      grid-column-end:span 1;

      z-index:6;
    }
      div#dockResizeSliver:hover
      {
        cursor:ew-resize;
      }

    WidgetsContainer
    {
      grid-column-start : 3;
      grid-column-end : span 1;
    }

    ATLASViewer
    {
      grid-column-start:1;
      grid-column-end:span 1;
      grid-row-start:1;
      grid-row-end:span 1;

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

  showRegion : boolean = false

  darktheme = false
  resizeDockedWidgetPanel = false
  controlPanelWidth = 250
  dockedWidgetPanelWidth = 300

  libraryLoaded : Map<SUPPORTED_LIB,boolean> = new Map()

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
  }

  calcGridTemplateColumn(){
    return this.hasDockedComponents() ? 
      `auto 10px ${this.dockedWidgetPanelWidth < 300 ? this.dockedWidgetPanelWidth : 300 }px` :
      `auto 0px 0px`
  }

  enableUIInteraction(bool:boolean){
    document.body.style.pointerEvents = bool ? 'all':'none'
    document.body.style.userSelect = bool ? 'initial' : 'none'
  }

  showRegionDialog(){
    this.showRegion = !this.showRegion
  }

  @HostListener('document:mousemove',['$event'])
  mousemove(ev:any){
    if(this.resizeDockedWidgetPanel){
      this.dockedWidgetPanelWidth = window.innerWidth - /*this.startcontrolPanelWidth + this.startpos -*/ ev.clientX
    }
  }

  @HostListener('document:mouseup',['$event'])
  mouseup(_ev:any){
    if(this.resizeDockedWidgetPanel){
      this.resizeDockedWidgetPanel=false;
      this.enableUIInteraction(true)
      if(this.mainController.nehubaViewer) this.mainController.nehubaViewer.redraw()
    }
  }
}