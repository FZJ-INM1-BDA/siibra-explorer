import { Component,ViewChild , HostListener, Renderer2 } from '@angular/core'
import { MainController, SUPPORTED_LIB, InfoToUIService, SUPPORT_LIBRARY_MAP, checkStringAsSupportLibrary, TEMP_SearchDatasetService } from 'nehubaUI//nehubaUI.services'
import { WidgetsContainer } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component'
import { NehubaBanner } from 'nehubaUI/mainUI/banner/nehubaUI.banner.component';
import { showSideBar } from 'nehubaUI/util/nehubaUI.util.animations'
import { Observable } from 'rxjs/Rx'

import template from './nehubaUI.parent.template.html'
import css from './nehubaUI.parent.style.css'
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Component({
  selector : 'div#ATLASContainer',
  template : template,
  styles : [ css ],
  host : {
    '[class.darktheme]':'darktheme'
  },
  animations : [ showSideBar ]
})

export class NehubaContainer {
  showMenu : boolean = false

  darktheme = false

  @ViewChild(WidgetsContainer) widgetContainer : WidgetsContainer
  @ViewChild(NehubaBanner) nehubaBanner : NehubaBanner

  Array = Array

  loadedLibraries : Map<SUPPORTED_LIB,{counter:number,src:HTMLElement|null}> = new Map()

  constructor(
    public infoToUI:InfoToUIService,
    public mainController:MainController, 
    private rd2:Renderer2,
    private searchDatasetService:TEMP_SearchDatasetService
  ){

    if('customElements' in window){
      this.loadedLibraries.set(SUPPORTED_LIB.webcomponentsLite,{counter:1,src:null})
    }

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
          if(!ledger){
            console.warn('unload external libraries error. cannot find ledger entry...',libname,this.loadedLibraries)
            return
          }
          if(ledger.src ===  null){
            console.log('webcomponents is native supported. no library needs to be unloaded')
            return
          }
          
          if(ledger.counter - 1 == 0){
            this.rd2.removeChild(document.head,ledger.src)
            this.loadedLibraries.delete(libname!)
          }else{
            this.loadedLibraries.set(libname!,{counter : ledger.counter - 1,src:ledger.src})
          }
        })
    this.mainController.selectedTemplateBSubject.subscribe(template=>{
      if(template)this.darktheme = template.useTheme == 'dark'
    })

    Observable
      .from(this.mainController.selectedParcellationBSubject)
      .filter(v=>v!==null)
      .debounceTime(1000)
      .subscribe(()=>this.showMenu = 
        (this.searchDatasetService.returnedSpatialSearchResultsBSubject.getValue().length + 
        this.searchDatasetService.returnedSearchResultsBSubject.getValue().length) > 0)

    // Observable
    //   .combineLatest(
    //     this.mainController.selectedTemplateBSubject,
    //     this.searchDatasetService.returnedSearchResultsBSubject,
    //     this.searchDatasetService.returnedSpatialSearchResultsBSubject)
    //   .filter(v=>v[0]!==null)
    //   .debounceTime(200)
    //   .map(v=>v[1].length + v[2].length)
    //   .subscribe(searchResultsLength=>
    //     this.showMenu = searchResultsLength > 0)
  }
  
  curosrPos : [number,number] = [0,0]
  @HostListener('document:mousemove',['$event'])
  mousemove(ev:MouseEvent){
    this.curosrPos = [ev.clientX,ev.clientY]
  }
}