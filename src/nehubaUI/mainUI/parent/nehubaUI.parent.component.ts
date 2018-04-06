import { Component,ViewChild ,AfterViewInit, HostListener, Renderer2 } from '@angular/core'
import { MainController, SUPPORTED_LIB, InfoToUIService, SUPPORT_LIBRARY_MAP, checkStringAsSupportLibrary } from 'nehubaUI//nehubaUI.services'
import { WidgetsContainer } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component'
import { NehubaBanner } from 'nehubaUI/mainUI/banner/nehubaUI.banner.component';
import { showSideBar } from 'nehubaUI/util/nehubaUI.util.animations'

import template from './nehubaUI.parent.template.html'
import css from './nehubaUI.parent.style.css'
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';

@Component({
  selector : 'div#ATLASContainer',
  template : template,
  styles : [ css ],
  host : {
    '[class.darktheme]':'darktheme'
  },
  animations : [ showSideBar ]
})

export class NehubaContainer implements AfterViewInit {
  showMenu : boolean = false

  darktheme = false

  @ViewChild(WidgetsContainer) widgetContainer : WidgetsContainer
  @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner

  Array = Array

  loadedLibraries : Map<SUPPORTED_LIB,{counter:number,src:HTMLElement}> = new Map()

  constructor(
    public infoToUI:InfoToUIService,
    public mainController:MainController, 
    private rd2:Renderer2
  ){
    this.darktheme = this.mainController.darktheme

    /* probably makes sense to associate dom manipulation to the highest level of viewer hierachy */
    INTERACTIVE_VIEWER.pluginControl.loadExternalLibraries = (libraryNames:string[]) =>
      new Promise((resolve,reject)=>{
        const resolvingLibraries = libraryNames.reduce((acc,name)=>{
          checkStringAsSupportLibrary(name) !== null ?
            acc[0].push( {name : name as keyof typeof SUPPORTED_LIB,srcEl:SUPPORT_LIBRARY_MAP.get( checkStringAsSupportLibrary( name )! )} ) :
            acc[1].push( {name : name} )
          return acc
        },[new Array(0),new Array(0)])

        if(resolvingLibraries[1].length > 0){
          reject(`Some library names cannot be recognised. No libraries were loaded: ${resolvingLibraries[1].map(obj=>obj.name).join(' , ')}`)
        }else{
          Promise.all(resolvingLibraries[0].map(scriptObj=>new Promise((rs,rj)=>{
            const existingEntry = this.loadedLibraries.get(scriptObj.name)
            if( existingEntry ){
              this.loadedLibraries.set( scriptObj.name , { counter : existingEntry.counter + 1 , src : existingEntry.src } )
              rs()
            }else{
              const srcEl = scriptObj.srcEl
              srcEl.onload = () => rs()
              srcEl.onerror = (e:any) => rj(e)
              this.rd2.appendChild(document.head,srcEl)
              this.loadedLibraries.set( scriptObj.name , { counter : 1 , src : srcEl } )
            }
          })))
            .then(()=>resolve())
            .catch(e=>(console.log(e),reject(e)))
        }
      })

    /* TODO optimise the unload fn. looks unsightly right now */
    INTERACTIVE_VIEWER.pluginControl.unloadExternalLibraries = (libraryNames:string[])=> 
      libraryNames
        .filter((stringname)=>checkStringAsSupportLibrary(stringname) !== null)
        .map(checkStringAsSupportLibrary)
        .forEach(libname=>{
          const ledger = this.loadedLibraries.get(libname!)
          if(ledger){
            if(ledger.counter - 1 == 0){
              this.rd2.removeChild(document.head,ledger.src)
              this.loadedLibraries.delete(libname!)
            }else{
              this.loadedLibraries.set(libname!,{counter : ledger.counter - 1,src:ledger.src})
            }
          }else{
            console.warn('unload external libraries error. cannot find ledger entry...',libname,this.loadedLibraries)
          }
        })
  }

  ngAfterViewInit(){
    // UI_CONTROL.afterTemplateSelection(()=>{
    //   this.darktheme = this.mainController.darktheme
    // })
    this.mainController.selectedTemplateBSubject.subscribe(template=>{
      if(template)this.darktheme = template.useTheme == 'dark'
    })
  }

  
  curosrPos : [number,number] = [0,0]
  @HostListener('document:mousemove',['$event'])
  mousemove(ev:MouseEvent){
    this.curosrPos = [ev.clientX,ev.clientY]
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