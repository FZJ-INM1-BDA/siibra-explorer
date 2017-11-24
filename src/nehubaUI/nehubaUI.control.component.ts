import { NgZone,Component,Input,OnInit,AfterViewInit,Output,ViewChild,EventEmitter} from '@angular/core'
import { NehubaFetchData,EventCenter,EXTERNAL_CONTROL as gExternalControl,EVENTCENTER_CONST,NEHUBAUI_CONSTANTS } from './nehubaUI.services'
import { Lab } from './nehubaUI.lab.component'
import { SelectTreePipe } from './nehubaUI.util.pipes'
import { PluginDescriptor,EventPacket, FetchedTemplates,TemplateDescriptor,ParcellationDescriptor,RegionDescriptor,LayerDescriptor } from './nehuba.model'
import { MultilevelSelector } from 'nehubaUI/nehubaUI.multilevel.component';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Component({
  selector : 'atlascontrol',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.control.template.html',
  providers : [ NehubaFetchData ],
})

export class NehubaUIControl implements OnInit,AfterViewInit{

  @Output() emitHideUI : EventEmitter<any> = new EventEmitter()
  @Input() searchTerm : String = ''
  @ViewChild(Lab) labComponent : Lab
  @ViewChild(MultilevelSelector) multilevelSelector : MultilevelSelector
  darktheme : boolean = false
  
  fetchedTemplatesData : FetchedTemplates

  selectedTemplate : TemplateDescriptor | undefined
  selectedParcellation : ParcellationDescriptor | undefined
  regionsLabelIndexMap : Map<Number,RegionDescriptor> = new Map()
  selectedRegions : RegionDescriptor[] = [];

  templatesPanelIsShown:boolean = true
  parcellationsPanelIsShown:boolean = false
  regionsPanelIsShown:boolean = false
  pluginsPanelIsShown:boolean = false

  constructor( 
    private nehubaFetchData : NehubaFetchData,
    private eventCenter:EventCenter,
    private zone:NgZone
    ){
    this.fetchedTemplatesData = new FetchedTemplates()

    this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
      switch(msg.target){
        case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
          this.darktheme = msg.body.theme == 'dark' 
          if ( this.darktheme ){
            document.body.classList.add('darktheme')
          } else {
            document.body.classList.remove('darktheme')
          }
        }break;
      }
    })

    gExternalControl.viewControl
      .filter((evPk:EventPacket)=>(evPk.target=='loadTemplate'||'loadParcellation'||'selectRegions')&&(evPk.code==100||evPk.code==101||evPk.code==103))
      .subscribe((evPk:EventPacket)=>{
        switch(evPk.code){
          case 100:{
            const nEvPk = evPk
            nEvPk.code = 101
            setTimeout(()=>{
              gExternalControl.viewControl.next(nEvPk)
            })
          }break;
          case 101:{
            const nEvPk = evPk
            nEvPk.code = 102
            setTimeout(()=>{
              gExternalControl.viewControl.next(nEvPk)
            })
          }break;
          case 103:{
            const nEvPk = evPk
            nEvPk.code = 200
            setTimeout(()=>{
              gExternalControl.viewControl.next(nEvPk)
            })
          }break;
        }
      })

    gExternalControl.viewControl
      .filter((evPk:EventPacket)=>evPk.target=='loadTemplate'&&evPk.code==102)
      .subscribe((evPk:EventPacket)=>{
        if( evPk.body.templateDescriptor ){
          try{
            this.zone.run(()=>{
              this.loadTemplate( evPk.body.templateDescriptor,evPk )
            })
          }catch(e){
            evPk.code = 500
            evPk.body.reason = 'templateDescriptor ill defined.'
            gExternalControl.viewControl.next( evPk )
          }
        }else if( evPk.body.name ){
          const openTemplate = this.fetchedTemplatesData.templates.find(template=>template.name==evPk.body.name)
          if( openTemplate ){
            this.zone.run(()=>{
              this.loadTemplate( openTemplate,evPk )
            })
          }else{
            evPk.code = 500
            evPk.body.reason = 'Could not find the template by name.'
            gExternalControl.viewControl.next( evPk )
          }
        }else{
          evPk.code = 500
          evPk.body.reason = 'either body.templateDescriptor : TemplateDescriptor | Object or body.name : string needs to be defined.'
          gExternalControl.viewControl.next( evPk )
        }
      })
    
    /**
     * when the parcellation has been loaded, map the regions
     */
    gExternalControl.viewControl
      .filter((evPk:EventPacket)=>evPk.target=='loadParcellation'&&evPk.code==102)
      .subscribe((evPk:EventPacket)=>{
        this.selectedParcellation = evPk.body.parcellation
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
        })
        this.updateRegionDescriptors( window.nehubaViewer.getShownSegmentsNow({name:this.selectedParcellation!.ngId}).map((id:any)=>({labelIndex:id})) )
  
        /* populate the metadata object */
        gExternalControl.metadata.parcellation = this.selectedParcellation

        /* progress the evPk lifecycle */
        const nEvPk = evPk
        nEvPk.code=103
        gExternalControl.viewControl.next(nEvPk)
      })

    /* user interact UI/plugin result in selectRegions */
    gExternalControl.viewControl
      .filter((evPk:EventPacket)=>evPk.target=='selectRegions'&&evPk.code==102&&evPk.body.source!='viewer')
      .subscribe((evPk:EventPacket)=>{
        /* first update the viewer */
        window.nehubaViewer.getShownSegmentsNow({name:this.selectedParcellation!.ngId}).forEach((idx:Number)=>window.nehubaViewer.hideSegment(idx,{name:this.selectedParcellation!.ngId}))
        if(evPk.body.regions.length>0){
          evPk.body.regions.forEach((region:any)=>{if(region.labelIndex)window.nehubaViewer.showSegment(region.labelIndex,{name:this.selectedParcellation!.ngId})})
        }else{
          window.nehubaViewer.showSegment(0,{name:this.selectedParcellation!.ngId})
        }

        /* then update the model */
        this.updateRegionDescriptors(evPk.body.regions)
      })

    /* user interact with viewer result in selectRegions */
    gExternalControl.viewControl
      .filter((evPk:EventPacket)=>evPk.target=='selectRegions'&&evPk.code==102&&evPk.body.source=='viewer')
      .subscribe((_evPk:EventPacket)=>this.updateRegionDescriptors(_evPk.body.regions))
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
        this.eventCenter.modalEventRelay.next(new EventPacket('showInfoModal','',100,{title:'Warning',body:message}))
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
        this.eventCenter.modalEventRelay.next(new EventPacket('showInfoModal','',100,{title:'Warning',body:message}))
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
        this.nehubaFetchData.fetchJson(json['UIConfigURL'])
          .then((json:any)=>{
            this.nehubaFetchData.parseTemplateData(json)
              .then( template =>{
                this.chooseTemplate( template )
              })
              .catch(e=>{
                throw new Error(e)
              })
            })

        /* TODO: find a more elegant solution in the future */
        setTimeout(()=>{
          json.plugins.forEach((plugin:any)=>{
            const newPlugin = new PluginDescriptor(plugin)
            this.labComponent.launchPlugin(newPlugin)
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
      this.nehubaFetchData.fetchJson(dataset)
        .then((json:any)=>{
          this.nehubaFetchData.parseTemplateData(json)
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

  loadTemplate(templateDescriptor:TemplateDescriptor,mEvPk?:EventPacket):void{

    /* send signals to modal and viewer to update the view */
    /* ID needed so that when loading template is complete, the dismiss signal with the correct ID can be sent */
    let id = Date.now().toString()
    let requestNewCurtainModal = new EventPacket('curtainModal',id,100,{})
    let curtainModalSubject = this.eventCenter.createNewRelay(requestNewCurtainModal)
    
    let eventPacket = new EventPacket('curtainModal',id,100,{title:'Loading Template ...',body:templateDescriptor.name+' is being loaded... '})
    curtainModalSubject.next(eventPacket)
    curtainModalSubject.subscribe((evPk:EventPacket)=>{
      switch(evPk.code){
        case 101:{
          this.eventCenter.globalLayoutRelay.next(new EventPacket(EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME,id,100,
            {theme:templateDescriptor.useTheme == 'dark' ? EVENTCENTER_CONST.GLOBALLAYOUT.BODY.THEME.DARK : EVENTCENTER_CONST.GLOBALLAYOUT.BODY.THEME.LIGHT}))
          this.eventCenter.nehubaViewerRelay.next(new EventPacket(EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.LOAD_TEMPALTE,id,100,templateDescriptor))
    
          /* update models in the controller */
          this.selectedTemplate = templateDescriptor
          this.selectedRegions = []

          this.chooseParcellation(templateDescriptor.parcellations[0])

          gExternalControl.metadata.template = this.selectedTemplate

          /* for the time being, parcellation is automatically chosen (?) TODO: there are current no usecase for single template with multiple parcellations.  */
          // this.chooseParcellation(this.selectedTemplate.parcellations[0])

          if(mEvPk){
            mEvPk.code = 103
            gExternalControl.viewControl.next(mEvPk)
          }
          
          /* TODO: temporary measure */
          setTimeout(()=>{
            curtainModalSubject.next(new EventPacket('curtainModal','',102,{}))
          },3000)
        }break;
        case 200:
        case 500:{
          curtainModalSubject.unsubscribe()
        }break;
      }
    })
  }

  chooseTemplate(templateDescriptor:TemplateDescriptor):void{
    if ( this.selectedTemplate != templateDescriptor ){
      this.selectedTemplate = templateDescriptor
      this.loadTemplate(templateDescriptor)
    }
  }

  refreshSelectedRegions(){
    const treePipe = new SelectTreePipe()

    /* TODO this may need to be reworked
    refresh gets called too often */
    if(this.selectedParcellation){
      gExternalControl.viewControl.next(
        new EventPacket('selectRegions','',100,{source:'ui',regions:treePipe.transform(this.selectedParcellation.regions)}))
    }
  }

  updateRegionDescriptors(regions:any[]){
      const labelIndices = regions.map(region=>region.labelIndex)
      gExternalControl.metadata.regions = []
      this.regionsLabelIndexMap.forEach(region=>region.enabled=false)
      labelIndices.forEach(idx=>{
        const region = this.regionsLabelIndexMap.get(idx)
        if(region) {
          region.enabled = true
          gExternalControl.metadata.regions.push(region)
        }
      })
  }

  chooseParcellation(parcellation:ParcellationDescriptor):void{
    if( this.selectedParcellation != parcellation ){
      gExternalControl.viewControl.next(new EventPacket('loadParcellation','',100,{source:'ui',oldParcellation:this.selectedParcellation,parcellation:parcellation}))
    }
  }

  showMoreInfo(item:any):void{
    this.eventCenter.modalEventRelay.next(new EventPacket('showInfoModal',Date.now().toString(),100,{title:item.name,body:item.properties}))
  }

  showInputModal(type:string):void{
    this.eventCenter.modalEventRelay.next(new EventPacket('showInputModal',Date.now().toString(),100,{title:'Add',title_:type}))
  }

  loadPresetShader(layer:LayerDescriptor):void{
    let packetId = Date.now().toString()
    let packetBody = {
      title : 'Load preset shader for layer ',
      layername : layer.name,
      currentshader : layer.properties.shader
    }
    let eventPacket = new EventPacket('loadPresetShader',packetId,100,packetBody)
    
    let requestForNewFloatingWidget = new EventPacket('floatingWidgetRelay',Date.now().toString(),100,{})
    let loadPresetShaderSubject = this.eventCenter.createNewRelay(requestForNewFloatingWidget)
    if( loadPresetShaderSubject ){
      loadPresetShaderSubject.subscribe((resp:EventPacket)=>{
        switch(resp.code){
          case 200:{
            layer.properties.shader = resp.body.code
          }
          case 404:{
            loadPresetShaderSubject!.unsubscribe()
          }break;
        }
      })
      loadPresetShaderSubject.next(eventPacket)
    }
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

  onScroll = (ev:any)=>{
    this.multilevelSelector.onScroll(ev)
  }
}


