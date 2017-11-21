import { NgZone,Component,Input,OnInit,AfterViewInit,Output,ViewChild,EventEmitter} from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'
import { NehubaFetchData,EventCenter,EXTERNAL_CONTROL as gExternalControl,EVENTCENTER_CONST,NEHUBAUI_CONSTANTS } from './nehubaUI.services'
import { Lab } from './nehubaUI.lab.component'
import { SelectTreePipe } from './nehubaUI.util.pipes'
import { PluginDescriptor,EventPacket, FetchedTemplates,TemplateDescriptor,ParcellationDescriptor,RegionDescriptor,LayerDescriptor } from './nehuba.model'

declare var window:{
    [key:string] : any
    prototype : Window;
    new() : Window;
}

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
    @Input() searchTerm : String = ''
    @ViewChild(Lab) labComponent : Lab
    darktheme : boolean = false
    
    fetchedTemplatesData : FetchedTemplates

    selectedTemplate : TemplateDescriptor | undefined
    selectedParcellation : ParcellationDescriptor | undefined
    regionsLabelIndexMap : Map<Number,RegionDescriptor> = new Map()
    selectedRegions : RegionDescriptor[] = [];

    //this is a temporary solution for collapsing menus
    defaultPanelsState : any = {
        templatesPanelState : 'expanded',
        parcellationsPanelState : 'collapsed',
        regionsPanelState : 'collapsed',
        navigationPanelState : 'collapsed',
        labPanelState : 'collapsed'
    }
    showTemplates : Boolean = true
    showParcellations : Boolean = true
    showRegions : Boolean = true

    showTemplatesState : string = 'expanded';

    heartbeatObserver : any /* hanging onto nehubaViewer event streams. Or else, when the last plugin unsubscribes, the Observable gets garbage collected. */

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
                }break;
            }
        })

        gExternalControl.viewControl
            .filter((evPk:EventPacket)=>(evPk.target=='loadTemplate'||'selectRegions')&&(evPk.code==100||evPk.code==101||evPk.code==103))
            .subscribe((evPk:EventPacket)=>{
                switch(evPk.code){
                    case 100:{
                        const nEvPk = evPk
                        nEvPk.code = 101
                        gExternalControl.viewControl.next(nEvPk)
                    }break;
                    case 101:{
                        /* loadTemplate pre hook */
                        if (this.heartbeatObserver&&evPk.target=='loadTemplate') this.heartbeatObserver.unsubscribe()

                        const nEvPk = evPk
                        nEvPk.code = 102
                        gExternalControl.viewControl.next(nEvPk)
                    }break;
                    case 103:{
                        const nEvPk = evPk
                        nEvPk.code = 200
                        gExternalControl.viewControl.next(nEvPk)

                        /* loadTemplate post hook, in order to prevent subscribers shutting down after last user unsubscribed */
                        this.heartbeatObserver = 
                            window['nehubaViewer'].mouseOver.segment
                                .merge(window['nehubaViewer'].navigationState.sliceZoom)
                                .merge(window['nehubaViewer'].navigationState.perspectiveZoom)
                                .subscribe((_ev:any)=>{
                                    //console.log('debug heartbeat',ev)
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

        gExternalControl.viewControl
            .filter((evPk:EventPacket)=>evPk.target=='selectRegions'&&evPk.code==102)
            .subscribe((evPk:EventPacket)=>{
                /* first update the viewer */
                window.nehubaViewer.getShownSegmentsNow({name:this.selectedParcellation!.ngId}).forEach((idx:Number)=>window.nehubaViewer.hideSegment(idx,{name:this.selectedParcellation!.ngId}))
                if(evPk.body.regions.length>0){
                    evPk.body.regions.forEach((idx:number)=>{if(idx)window.nehubaViewer.showSegment(idx,{name:this.selectedParcellation!.ngId})})
                }else{
                    window.nehubaViewer.showSegment(0,{name:this.selectedParcellation!.ngId})
                }

                /* then update the model */
                this.updateRegionDescriptors(evPk.body.regions)
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

    loadTemplate(templateDescriptor:TemplateDescriptor,mEvPk:EventPacket):void{

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
                    this.selectedParcellation = undefined

                    gExternalControl.metadata.template = this.selectedTemplate

                    /* for the time being, parcellation is automatically chosen (?) TODO: there are current no usecase for single template with multiple parcellations.  */
                    // this.chooseParcellation(this.selectedTemplate.parcellations[0])

                    mEvPk.code = 103
                    gExternalControl.viewControl.next(mEvPk)
                    
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
            gExternalControl.viewControl.next(new EventPacket('loadTemplate','',100,{templateDescriptor:templateDescriptor}))
        }
    }

    refreshSelectedRegions(){
        const treePipe = new SelectTreePipe()
        if(this.selectedParcellation){
            gExternalControl.viewControl.next(new EventPacket('selectRegions','',100,
            {regions:treePipe.transform(this.selectedParcellation.regions).map(region=>region.labelIndex ? region.labelIndex : null)}))
        }
    }

    updateRegionDescriptors(labelIndices:Number[]){
        gExternalControl.metadata.regions = []
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
            mapRegions(this.selectedParcellation.regions)

            /* TODO temporary measure, until nehubaviewer has its own way of controlling layers */
            this.selectedTemplate!.parcellations.forEach((parcellation:ParcellationDescriptor)=>{
                window.viewer.layerManager.getLayerByName( parcellation.ngId ).setVisible(false)
            })
            setTimeout(()=>{
                window.viewer.layerManager.getLayerByName( this.selectedParcellation!.ngId ).setVisible(true)
            })

            this.updateRegionDescriptors( window.nehubaViewer.getShownSegmentsNow({name:this.selectedParcellation.ngId}) )

            /* populate the metadata object */
            gExternalControl.metadata.parcellation = this.selectedParcellation
        }
    }

    /* obsolete with multilevel */
    chooseRegion(region:RegionDescriptor):void{
        let idx = this.selectedRegions.findIndex( itRegion => itRegion === region )
        idx < 0 ? this.selectedRegions.push( region ) : this.selectedRegions.splice( idx , 1 )

        gExternalControl.metadata.selectedRegions = this.selectedRegions
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
                this.labComponent.appendPlugin(sth)
            }break;
        }
    }
}


