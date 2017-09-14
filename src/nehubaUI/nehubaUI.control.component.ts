import { Component,Input,OnInit,AfterViewInit,Output,ViewChild,EventEmitter} from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'
import { NehubaFetchData,EventCenter,EVENTCENTER_CONST,NEHUBAUI_CONSTANTS } from './nehubaUI.services'
import { Lab } from './nehubaUI.lab.component'
import { PluginDescriptor,EventPacket, FetchedTemplates,TemplateDescriptor,ParcellationDescriptor,RegionDescriptor,LayerDescriptor } from './nehuba.model'

import { NehubaViewer } from 'nehuba/exports'

@Component({
    selector : 'atlascontrol',
    templateUrl : 'src/nehubaUI/templates/nehubaUI.control.template.html',
    animations : [
        trigger('panelExpansion',[
            state('collapsed',style({
                height : '0em',
                paddingTop : '0em',
                paddingBottom : '0em',
            })),
            state('expanded',style({

            })),
            transition('collapsed <=> expanded',animate('0ms'))
        ]),
        trigger('panelExpansionExtra',[
            state('collapsed',style({
            })),
            state('expanded',style({
                height : '0em',
                paddingTop : '0em',
                paddingBottom : '0em',
            })),
            transition('collapsed <=> expanded',animate('1ms'))
        ])
    ],
    providers : [ NehubaFetchData ],

})

export class NehubaUIControl implements OnInit,AfterViewInit{

    @Output() emitHideUI : EventEmitter<any> = new EventEmitter()
    @Input() nehubaViewer : NehubaViewer
    @Input() searchTerm : String = ''
    @ViewChild(Lab) labComponent : Lab
    darktheme : boolean = false
    
    fetchedTemplatesData : FetchedTemplates

    listOfActiveLayers : LayerDescriptor[] = []
    enableAdvancedMode : string = 'off'

    selectedTemplate : TemplateDescriptor | undefined
    selectedParcellation : ParcellationDescriptor | undefined
    selectedRegions : RegionDescriptor[] = [];

    //this is a temporary solution for collapsing menus
    defaultPanelsState : any
    showTemplates : Boolean = true
    showParcellations : Boolean = true
    showRegions : Boolean = true

    showTemplatesState : string = 'expanded';

    constructor( 
        private nehubaFetchData : NehubaFetchData,
        private eventCenter:EventCenter
        ){
        this.fetchedTemplatesData = new FetchedTemplates()

        /* this has to do with viewer state. I'd prefer if this was not in the component. Or segregate this into a separate component */
        this.defaultPanelsState = {
            templatesPanelState : 'expanded',
            parcellationsPanelState : 'collapsed',
            regionsPanelState : 'collapsed',
            navigationPanelState : 'collapsed',
            labPanelState : 'collapsed'
        }

        this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
            switch(msg.target){
                case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
                    this.darktheme = msg.body.theme == 'dark' 
                }break;
            }
        })
    }

    /** on view init 
     * bind listeners for navigation changes
     * fetch default templates
     */
    ngOnInit():void{
        (()=>{
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl')
            const message:any = {
                General:['Your browser does not seem to meet the minimum requirements to run neuroglancer.']
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
        const query = window.location.search.substring(1)
        const toolModeURL = query.split('&').find(kv=>kv.split('=')[0]=='toolmode')
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
            'http://172.104.156.15/json/colin'
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
            })
    }

    chooseTemplate(templateDescriptor:TemplateDescriptor):void{
        if ( this.selectedTemplate != templateDescriptor ){
            /* send signals to modal and viewer to update the view */
            /* ID needed so that when loading template is complete, the dismiss signal with the correct ID can be sent */
            let id = Date.now().toString()
            let requestNewCurtainModal = new EventPacket('curtainModal',id,100,{})
            let curtainModalSubject = this.eventCenter.createNewRelay(requestNewCurtainModal)
            
            let eventPacket = new EventPacket('curtainModal',id,100,{title:'Loading Template ...',body:templateDescriptor.name+' is being loaded... TODO: currently this modal closes after 3 seconds. In the future, this behaviour should changed so that when the template finishes loading, this modal closes automatically.'})
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
                        this.selectedParcellation = undefined
            
                        /* update layers in the advanced mode */
                        /* probably awaiting nehuba viewer to implement two way binding of things like shader code and transformation matrix */
                        this.listOfActiveLayers = []
                        let ngJson = templateDescriptor.nehubaConfig.dataset!.initialNgState
                        for (let key in ngJson.layers){
                            this.listOfActiveLayers.push(new LayerDescriptor(key,ngJson.layers[key]))
                        }
                        
                        /* TODO: temporary measure */
                        setTimeout(()=>{
                            curtainModalSubject.next(new EventPacket('curtainModal','',102,{}))
                        },3000)
                    }break;
                    case 200:
                    case 404:{
                        curtainModalSubject.unsubscribe()
                    }break;
                }
            })
        }
    }

    chooseParcellation(parcellation:ParcellationDescriptor):void{
        if( this.selectedParcellation != parcellation ){
            this.selectedParcellation = parcellation
            this.selectedRegions = []
        }
    }

    /* obsolete with multilevel */
    chooseRegion(region:RegionDescriptor):void{
        let idx = this.selectedRegions.findIndex( itRegion => itRegion === region )
        idx < 0 ? this.selectedRegions.push( region ) : this.selectedRegions.splice( idx , 1 )
    }

    isRegionSelected(region:RegionDescriptor):boolean{
        return this.selectedRegions.some( itRegion => itRegion === region )
    }

    /* TODO: this should go else where */
    toggleDefaultPanel(name:string,preventDefault:boolean):void{
        preventDefault ? {}:this.defaultPanelsState[name] == 'expanded' ? this.defaultPanelsState[name] = 'collapsed' : this.defaultPanelsState[name] = 'expanded'
    }

    /* TODO: this should go elsewhere */
    toggleCollapse(id:String):void{
        //temporary solution, see above
        switch(id){
            case 'templates': {
                this.showTemplates = !this.showTemplates
                this.showTemplatesState === 'expanded' ? this.showTemplatesState = 'collapsed' : this.showTemplatesState = 'expanded'
            };
            break;
            case 'parcellations': this.showParcellations = !this.showParcellations;
            break;
            case 'regions': this.showRegions = !this.showRegions;
            break;
        }
    }

    showMoreInfo(item:any):void{
        this.eventCenter.modalEventRelay.next(new EventPacket('showInfoModal',Date.now().toString(),100,{title:item.name,body:item.properties}))
    }

    showInputModal(type:string):void{
        this.eventCenter.modalEventRelay.next(new EventPacket('showInputModal',Date.now().toString(),100,{title:'Add',title_:type}))
        // this.modal.showInputModal('Add '+type)
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
                this.enableAdvancedMode = 'off'
                this.labComponent.appendPlugin(sth)
            }break;
        }
    }
}


