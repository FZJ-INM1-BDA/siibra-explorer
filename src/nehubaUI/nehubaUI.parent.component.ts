import { Component,ViewChild ,AfterViewInit,Renderer2 } from '@angular/core'
import { UI_CONTROL,MainController,EXTERNAL_CONTROL as gExternalControl, SUPPORTED_LIB, SUPPORT_LIBRARY_MAP } from './nehubaUI.services'
import { WidgetsContainer } from './nehubaUI.widgets.component'
import { NehubaBanner } from 'nehubaUI/nehubaUI.banner.component';
import { showSideBar } from 'nehubaUI/nehubaUI.util.animations'

@Component({
  selector : 'div#ATLASContainer',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.parent.template.html',
  styles : [
    `
    div[containerDiv]
    {
      height:100%;
      width:100%;
      display:flex;
      flex-direction:row;
    }


    div#dockResizeSliver
    {
      flex: 0 0 20px;
      background-color:rgba(128,128,128,0.08);
      z-index:6;
      display: flex;
      justify-content:center;
      flex-direction:column;
    }
      div#dockResizeSliver:hover
      {
        cursor:pointer;
        background-color:rgba(128,128,128,0.2);
      }

      div#dockResizeSliver > i:after
      {
        content : ' '
      }

    WidgetsContainer
    {
      flex: 0 0 0px;
    }

    ATLASViewer
    {
      flex: 1 1 auto;
      z-index:5;
      position:relative;
    }
    div[atlasBannerContainer]
    {
      display:flex;
      flex-direction:row;
      position:absolute;
      z-index:6;
    }
    atlasbanner[overlayBanner]
    {
      flex: 1 1 0px;
    }
    `
  ],
  host : {
    '[class.darktheme]':'darktheme'
  },
  animations : [ showSideBar ]
})

export class NehubaContainer implements AfterViewInit {
  showMenu : boolean = false


  darktheme = false
  resizeDockedWidgetPanel = false
  dockedWidgetPanelWidth = 350

  showDockedPanel : boolean = false

  /* TODO move this to one of the services */
  libraryLoaded : Map<SUPPORTED_LIB,boolean> = new Map()

  @ViewChild(WidgetsContainer) widgetContainer : WidgetsContainer
  @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner

  constructor(public mainController:MainController, private rd2:Renderer2){
    this.darktheme = this.mainController.darktheme

    /* TODO why is load external library here? */
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
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = this.mainController.darktheme
    })
  }

  showMenuDone(){
    if(this.mainController.nehubaViewer) this.mainController.nehubaViewer.redraw()
    this.animationDone = true
  }

  redrawViewer = () => {
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }
  }
  
  animationDone : boolean = true

  onAnimationFrameCallback = ()=>{
    this.redrawViewer()
    if(!this.animationDone){
      requestAnimationFrame(this.onAnimationFrameCallback)
    }
  }
  
  startShowMenu(){
    this.animationDone = false
    this.onAnimationFrameCallback()
  }
  /* TODO if enableProd is disabled, this throws an error
  investigate https://angular.io/api/core/ChangeDetectorRef
  */
  // hasDockedComponents(){
  //   // return true
  //   return this.widgetContainer.dockedWidgetContainer.viewContainerRef ? 
  //     this.widgetContainer.dockedWidgetContainer.viewContainerRef.length > 0 :
  //     false
  // }

  // calcGridTemplateColumn(){
  //   return this.hasDockedComponents() ? 
  //     `auto 10px ${this.dockedWidgetPanelWidth < 350 ? this.dockedWidgetPanelWidth : 350 }px` :
  //     `auto 0px 0px`
  // }

  // enableUIInteraction(bool:boolean){
  //   document.body.style.pointerEvents = bool ? 'all':'none'
  //   document.body.style.userSelect = bool ? 'initial' : 'none'
  // }

  // @HostListener('document:mousemove',['$event'])
  // mousemove(ev:any){
  //   if(this.resizeDockedWidgetPanel){
  //     this.dockedWidgetPanelWidth = window.innerWidth - /*this.startcontrolPanelWidth + this.startpos -*/ ev.clientX
  //   }
  // }

  // @HostListener('document:mouseup',['$event'])
  // mouseup(_ev:any){
  //   if(this.resizeDockedWidgetPanel){
  //     this.resizeDockedWidgetPanel=false;
  //     this.enableUIInteraction(true)
  //     if(this.mainController.nehubaViewer) this.mainController.nehubaViewer.redraw()
  //   }
  // }
}