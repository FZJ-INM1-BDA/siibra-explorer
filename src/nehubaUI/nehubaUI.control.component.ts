import { Component,Input,OnInit,AfterViewInit,Output,ViewChild,EventEmitter} from '@angular/core'
import { UI_CONTROL,VIEWER_CONTROL,DataService,EXTERNAL_CONTROL as gExternalControl,NEHUBAUI_CONSTANTS } from './nehubaUI.services'
import { Lab } from './nehubaUI.lab.component'
import { ModalHandler } from './nehubaUI.modal.component'
import { SelectTreePipe } from './nehubaUI.util.pipes'
import { FetchedTemplates,TemplateDescriptor,ParcellationDescriptor,RegionDescriptor } from './nehuba.model'
import { MultilevelSelector } from 'nehubaUI/nehubaUI.multilevel.component';
import { NehubaViewer } from 'nehuba/NehubaViewer';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Component({
  selector : 'atlascontrol',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.control.template.html'
})

export class NehubaUIControl implements OnInit,AfterViewInit{

  @Output() emitHideUI : EventEmitter<any> = new EventEmitter()
  @Input() searchTerm : String = ''
  @ViewChild(Lab) labComponent : Lab
  @ViewChild(MultilevelSelector) multilevelSelector : MultilevelSelector
  darktheme : boolean = false
  
  fetchedTemplatesData : FetchedTemplates

  private shownSegmentsObserver : any

  selectedTemplate : TemplateDescriptor | undefined
  selectedParcellation : ParcellationDescriptor | undefined
  regionsLabelIndexMap : Map<Number,RegionDescriptor> = new Map()
  selectedRegions : RegionDescriptor[] = [];

  templatesPanelIsShown:boolean = true
  parcellationsPanelIsShown:boolean = false
  regionsPanelIsShown:boolean = false
  pluginsPanelIsShown:boolean = false

  onTemplateSelectionHook : (()=>void)[] = []
  afterTemplateSelectionHook : (()=>void)[] = []
  onParcellationSelectionHook : (()=>void)[] = []
  afterParcellationSelectionHook : (()=>void)[] = []

  constructor( private dataService : DataService ){
    this.fetchedTemplatesData = new FetchedTemplates()

    UI_CONTROL.onTemplateSelection = (cb:()=>void) => this.onTemplateSelectionHook.push(cb)
    UI_CONTROL.afterTemplateSelection = (cb:()=>void) => this.afterTemplateSelectionHook.push(cb)
    UI_CONTROL.onParcellationSelection = (cb:()=>void) => this.onParcellationSelectionHook.push(cb)
    UI_CONTROL.afterParcellationSelection = (cb:()=>void) => this.onParcellationSelectionHook.push(cb)

    this.afterTemplateSelectionHook.push(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false
    })
  }

  /** on view init 
   * checking browser compatibility
   */
  ngOnInit():void{
    (()=>{
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl')
      const message:any = {
        Error:['Your browser does not meet the minimum requirements to run neuroglancer.']
      }
      if(!gl){
        message['Detail'] = 'Your browser does not support WebGL.'
        
        const modalHandler = <ModalHandler>window['nehubaUI'].util.modalControl.getModalHandler()
        modalHandler.title = `<h4>Error</h4>`
        modalHandler.body = message
        modalHandler.footer = null
        modalHandler.show()
        return
      }
      
      const drawbuffer = gl.getExtension('WEBGL_draw_buffers')
      const texturefloat = gl.getExtension('OES_texture_float')
      const indexuint = gl.getExtension('OES_element_index_uint')
      if( !(drawbuffer && texturefloat && indexuint) ){
        const detail = `Your browser does not support 
        ${ !drawbuffer ? 'WEBGL_draw_buffers' : ''} 
        ${ !texturefloat ? 'OES_texture_float' : ''} 
        ${ !indexuint ? 'OES_element_index_uint' : ''} `
        message['Detail'] = [detail]
        
        const modalHandler = <ModalHandler>window['nehubaUI'].util.modalControl.getModalHandler()
        modalHandler.title = `<h4>Error</h4>`
        modalHandler.body = message
        modalHandler.footer = null
        modalHandler.show()
      }
    })()
  }

  ngAfterViewInit():void{

    /* TODO to be replaced by hash encoded string instead in the future */
    const query = window.location.search.substring(1)
    const toolModeURL = query.split('&').find((kv:any)=>kv.split('=')[0]=='toolmode')
    if ( toolModeURL ){
      Promise.race([
        new Promise((resolve,_)=>{
          const PRECONFIGURED_TOOLMODES : any =  NEHUBAUI_CONSTANTS.toolmode 
          if ( PRECONFIGURED_TOOLMODES[ toolModeURL.split('=')[1] ] ){
            resolve(PRECONFIGURED_TOOLMODES[ toolModeURL.split('=')[1] ])
          }
        }),
        new Promise((resolve,reject)=>{
          Promise.race([
            new Promise((resolve,reject)=>{
              fetch(toolModeURL.split('=')[1])
                .then(res=>resolve(res))
                .catch(e=>reject(e))
            }),
            new Promise((_,reject)=>{
              setTimeout(()=>{
                reject('Fetching toolmodeurl timeout, 10000ms')
              },10000)
            })
          ])
          .then((res:any)=>res.json())
          .then(((json:any)=>{resolve(json)}))
          .catch(e=>reject(e))
        })
      ])
      .then((json:any)=>{
        this.dataService.fetchJson(json['UIConfigURL'])
          .then((json:any)=>{
            this.dataService.parseTemplateData(json)
              .then( template =>{
                this.chooseTemplate( template )
              })
              .catch(e=>{
                throw new Error(e)
              })
            })

        /* TODO: find a more elegant solution in the future */
        setTimeout(()=>{
          json.plugins.forEach((_plugin:any)=>{
            // const newPlugin = new PluginDescriptor(plugin)
            // this.labComponent.launchPlugin(newPlugin)
          })
        },3000)
        this.emitHideUI.emit({hideUI:true})
      })
      .catch(e=>{
        console.log(e)
        this.loadInitDatasets()
      })
    }else{
      this.loadInitDatasets()
    }
    
    this.afterParcellationSelectionHook.push(()=>{
      const nehubaViewer = (<NehubaViewer>window.nehubaViewer)
      
      nehubaViewer.clearCustomSegmentColors()
      if( this.selectedParcellation ){
        nehubaViewer.setMeshesToLoad( Array.from(this.selectedParcellation.colorMap.keys()) )
        nehubaViewer.batchAddAndUpdateSegmentColors( this.selectedParcellation.colorMap )
      }

      const shownSegmentsObservable = nehubaViewer.getShownSegmentsObservable()
      this.shownSegmentsObserver = shownSegmentsObservable.subscribe(segs=>{
        this.updateRegionDescriptors(segs)

        if( this.selectedParcellation ){
          if( this.selectedParcellation.surfaceParcellation ){
            //TODO need to test init condition... if selectedRegions is a subset of total regions, what happens?
            if( segs.length == 0 ){
              nehubaViewer.clearCustomSegmentColors()
              nehubaViewer.batchAddAndUpdateSegmentColors( this.selectedParcellation.colorMap )
            }else{
              const newColormap = new Map()
              const blankColor = {red:255,green:255,blue:255}
              this.selectedParcellation.colorMap.forEach((activeValue,key)=>{
                newColormap.set(key, segs.find(seg=>seg==key) ? activeValue : blankColor)
              })
              nehubaViewer.clearCustomSegmentColors()
              nehubaViewer.batchAddAndUpdateSegmentColors( newColormap )
            }
          }
        }
      })
    })

    this.onParcellationSelectionHook.push(()=>{
      if (this.shownSegmentsObserver) this.shownSegmentsObserver.unsubscribe()
    })
  }

  loadInitDatasets(){

    /* this will need to come from elsewhere eventually */
    let datasetArray = [
      'http://172.104.156.15/json/bigbrain',
      'http://172.104.156.15/json/colin',
      'http://172.104.156.15/json/waxholmRatV2_0',
      'http://172.104.156.15/json/allenMouse'
    ]

    datasetArray.forEach(dataset=>{
      this.dataService.fetchJson(dataset)
        .then((json:any)=>{
          this.dataService.parseTemplateData(json)
            .then( template =>{
              this.fetchedTemplatesData.templates.push( template )
            })
            .catch(e=>{
              console.log(e)
            })
          })
        .catch((e:any)=>{
          console.log('fetch init dataset error',e)
        })
      })
  }

  loadTemplate(templateDescriptor:TemplateDescriptor):void{

    const modalHandler = <ModalHandler>window['nehubaUI'].util.modalControl.getModalHandler()
    modalHandler.title = `<h4>Loading template ${templateDescriptor.name} </h4>`
    modalHandler.body = `Please stand by ...`
    modalHandler.footer = null

    modalHandler.onShown(()=>{
      /* TODO onshown method does not fire at correct timing, investigate for issues */
      setTimeout(()=>{
        VIEWER_CONTROL.loadTemplate(templateDescriptor)
        this.selectedTemplate = templateDescriptor
        gExternalControl.metadata.selectedTemplate = this.selectedTemplate
        this.afterTemplateSelectionHook.forEach(cb=>cb())
        
        this.chooseParcellation( templateDescriptor.parcellations[0] )
        gExternalControl.metadata.selectedRegions = []
      },200)
      /* TODO waiting for nehuba API on when it's safe to dismiss the modal */
      setTimeout(()=>{
        modalHandler.hide()
      },3000)
    })
    modalHandler.show()
  }

  chooseTemplate(templateDescriptor:TemplateDescriptor):void{
    if ( this.selectedTemplate != templateDescriptor ){
      this.onTemplateSelectionHook.forEach(cb=>cb())
      this.loadTemplate(templateDescriptor)
    }
  }

  refreshSelectedRegions(){
    const treePipe = new SelectTreePipe()
    treePipe
    if(this.selectedParcellation){
      (new Promise((resolve)=>{
        resolve( treePipe.transform(this.selectedParcellation!.regions)
          .map(region=>region.labelIndex) )
      }))
        .then((segments:number[])=>{
          VIEWER_CONTROL.hideAllSegments()
          segments.forEach(seg=>VIEWER_CONTROL.showSegment(seg))
        })
    }
  }

  updateRegionDescriptors(labelIndices:number[]){
    gExternalControl.metadata.selectedRegions = []
    this.regionsLabelIndexMap.forEach(region=>region.enabled=false)
    labelIndices.forEach(idx=>{
      const region = this.regionsLabelIndexMap.get(idx)
      if(region) {
        region.enabled = true
        gExternalControl.metadata.selectedRegions.push(region)
      }
    })
  }

  chooseParcellation(parcellation:ParcellationDescriptor):void{
    if( this.selectedParcellation != parcellation ){
      this.onParcellationSelectionHook.forEach(cb=>cb())

      this.selectedParcellation = parcellation
      this.selectedRegions = []

      const mapRegions = (regions:RegionDescriptor[])=>{
        regions.forEach((region:RegionDescriptor)=>{
          if(region.labelIndex){
            this.regionsLabelIndexMap.set(region.labelIndex,region)
          }
          if(region.children){
            mapRegions(region.children)
          }
        })
      }
      this.regionsLabelIndexMap.clear()
      mapRegions(this.selectedParcellation!.regions)

      /* TODO temporary measure, until nehubaviewer has its own way of controlling layers */
      this.selectedTemplate!.parcellations.forEach((parcellation:ParcellationDescriptor)=>{
        window.viewer.layerManager.getLayerByName( parcellation.ngId ).setVisible(false)
      })
      setTimeout(()=>{
        window.viewer.layerManager.getLayerByName( this.selectedParcellation!.ngId ).setVisible(true)
        window.nehubaViewer.redraw()
      })
      this.updateRegionDescriptors( window.nehubaViewer.getShownSegmentsNow({name:this.selectedParcellation!.ngId}).map((id:any)=>({labelIndex:id})) )

      /* populate the metadata object */
      gExternalControl.metadata.selectedParcellation = this.selectedParcellation

      this.afterParcellationSelectionHook.forEach(cb=>cb())
    }
  }

  showMoreInfo(_item:any):void{
    
  }

  showInputModal(_type:string):void{
    
  }

  fetchedSomething(sth:any){
    switch( sth.constructor.name ){
      case 'TemplateDescriptor':{
        this.fetchedTemplatesData.templates.push(sth)
      }break;
      case 'ParcellationDescriptor':{
        if (!this.selectedTemplate){
          //TODO add proper feedback
          console.log('throw error: maybe you should selected a template first')
        }else {
          this.selectedTemplate.parcellations.push(sth)
        }
      }break;
      case 'PluginDescriptor':{
        this.labComponent.appendPlugin(sth)
      }break;
    }
  }

  multilvlExpansionTreeShake = (ev:any):void=>{
    /* this event should in theory not happen, but catching just in case */
    if( !this.selectedParcellation ){
      return
    }
    this.searchTerm = ev

    /* timeout is necessary as otherwise, treeshaking collapses based on the previous searchTerm */
    setTimeout(()=>{
      if( this.searchTerm != '' ){
        const propagate = (arr:RegionDescriptor[])=>arr.forEach(item=>{
          item.isExpanded = item.hasVisibleChildren()
          propagate(item.children)
        })
        if(this.selectedParcellation)propagate(this.selectedParcellation.regions)
      }
    })
  }

  /**
   * the propagation event is needed to ensure the info panel stay with the element when scrolling
   */
  onScroll = (ev:any)=>{
    this.multilevelSelector.onScroll(ev)
  }
}


