
import { Component,Input,Output,OnInit,AfterViewInit,NgZone,ViewChild,EventEmitter} from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'
import { NehubaFetchData,EventCenter,Animation } from './nehubaUI.services'
import { EventPacket, FetchedTemplates,TemplateDescriptor,ParcellationDescriptor,RegionDescriptor,LayerDescriptor } from './nehuba.model'
import { NehubaModal } from './nehubaUI.modal.component'

import { NehubaViewer,vec3 } from 'nehuba/exports'

@Component({
    selector : 'atlascontrol',
    templateUrl : 'src/nehubaUI/templates/nehubaUI.template.html',
    styleUrls : [ 
        'src/nehubaUI/templates/bootstrap.css',
        'src/nehubaUI/templates/nehubaUI.template.css'
         ],
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
    providers : [ NehubaFetchData,NehubaModal ],

})

export class NehubaUIControl implements OnInit,AfterViewInit{

    @Input() nehubaViewer : NehubaViewer
    @Input() searchTerm : String = '';
    @Output() public darktheme : boolean = false;
    @Output() presetShader = new EventEmitter<LayerDescriptor>()
    
    @ViewChild(NehubaModal) public modal:NehubaModal
    fetchedTemplatesData : FetchedTemplates;

    listOfActiveLayers : LayerDescriptor[] = []
    enableAdvancedMode : string = 'off'

    selectedTemplate : TemplateDescriptor | undefined; 
    selectedParcellation : ParcellationDescriptor | undefined; 
    selectedRegions : RegionDescriptor[] = []; 

    //this is a temporary solution for collapsing menus
    defaultPanelsState : any
    showTemplates : Boolean = true;
    showParcellations : Boolean = true;
    showRegions : Boolean = true;

    showTemplatesState : string = 'expanded';
    viewerVoxelCoord : number[] = [0,0,0]

    constructor( 
        private nehubaFetchData : NehubaFetchData,
        private zone:NgZone,
        private eventCenter:EventCenter
        ){
        this.fetchedTemplatesData = new FetchedTemplates()

        /* this has to do with viewer state. I'd prefer if this was not in the component. Or segregate this into a separate component */
        this.defaultPanelsState = {
            templatesPanelState : 'expanded',
            parcellationsPanelState : 'collapsed',
            regionsPanelState : 'collapsed',
            navigationPanelState : 'collapsed'
        }

        this.eventCenter.navigationUpdateRelay.subscribe((ev:EventPacket)=>{
            this.viewerVoxelCoord = ev.body.pos
        })
        // this.enableAdvancedMode = 'off'
    }

    /** on view init 
     * bind listeners for navigation changes
     * fetch default templates
     */
    ngOnInit():void{

        /* load default dataset */
        /* TODO: Migrate to service.ts */
        this.loadInitDatasets()
    }

    ngAfterViewInit():void{
        /* call template hook to do something? */
        //listening for navigation state changes
        //this is the angular2 way of implementing $scope.$apply() 
        //if changed.add(listener) directly, the model does not get updated
        
        /* waiting for nehuba controller */
        // this.navigationControl = this.nehubaViewer.ngviewer

        // this.navigationControl.navigationState.changed.add(()=>{
        //     this.zone.runOutsideAngular(()=>{
        //         (this.nehubaNavigator.navigationStateChangeListener).bind(this.nehubaNavigator)(()=>{
        //             this.zone.run(()=>{})
        //         })
        //     })
        // })

        // this.navigationControl.mouseState.changed.add(()=>{
        //     this.zone.runOutsideAngular(()=>{
        //         (this.nehubaNavigator.mouseMoveChangeListener).bind(this.nehubaNavigator)(()=>{
        //             this.zone.run(()=>{})
        //         })
        //     })
        // })

        /* Listening to navigation request calls */
        this.eventCenter.navigationRelay.subscribe((msg:EventPacket)=>{
            let deltaPos = [
                msg.body.pos[0]-this.viewerVoxelCoord[0],
                msg.body.pos[1]-this.viewerVoxelCoord[1],
                msg.body.pos[2]-this.viewerVoxelCoord[2]
            ]

            let startPos = this.viewerVoxelCoord
            
            startPos
            deltaPos

            let iterator = (new Animation(300,'linear')).generate()
            
            let newAnimationFrame = () =>{
                let iteratedValue = iterator.next()
                this.nehubaViewer.setPosition(vec3.fromValues(
                    startPos[0]+deltaPos[0]*iteratedValue.value,
                    startPos[1]+deltaPos[1]*iteratedValue.value,
                    startPos[2]+deltaPos[2]*iteratedValue.value
                ),false)
                if(!iteratedValue.done){
                    requestAnimationFrame(newAnimationFrame)
                }
            }
            requestAnimationFrame(newAnimationFrame)

        })      
        
        /* listening to segment selection request calls */
        this.eventCenter.segmentSelectionRelay.subscribe((msg:EventPacket)=>{
            if (msg.body.mode == 'show'){
                this.nehubaViewer.showSegment(msg.body.segID)
                /* TODO: remove this in production. let's have some FUN! */

                let iterator = (new Animation(100,'linear')).randomSteps(0.1)
                let R = 0.1, G = 0.5, B = 0.9
                let newAnimationFrame = () =>{
                    this.nehubaViewer.clearCustomSegmentColors()
                    let RV = iterator.next(R)
                    R += RV.value 
                    let GV = iterator.next(G)
                    G += GV.value 
                    let BV = iterator.next(B)
                    B += BV.value

                    this.nehubaViewer.setSegmentColor(msg.body.segID,{
                            red :       Math.round((Math.sin(R)/2+0.5)*255),
                            green :     Math.round((Math.sin(G)/2+0.5)*255),
                            blue:       Math.round((Math.sin(B)/2+0.5)*255)})
                    requestAnimationFrame(newAnimationFrame)
                }
                requestAnimationFrame(newAnimationFrame)
            }else if(msg.body.mode == 'hide'){
                this.nehubaViewer.hideSegment(msg.body.segID)
            }
        })

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

            let curtainMessage = {
                title : 'Loading template',
                message : 'Please wait while the template is being loaded ... TODO: this modal currently dismiss on a timer. In production, it will wait for the viewer\'s completion signal, and then gets dismissed. ',
                dismissable : false
            }
            this.modal.curtainLower( curtainMessage ).then( modal =>{

                /* required, as promise is async */
                /* or ... is it? */
                this.zone.run(()=>{

                    /* deselect the current template */
                    this.selectedTemplate = templateDescriptor
                    this.selectedRegions = []
                    this.selectedParcellation = undefined

                    /* change the nehubaviewerconfig  */
                    this.nehubaViewer.config = this.selectedTemplate.nehubaConfig

                    /* currently, parses layer directly from nehubaConfig */
                    /* probably expecting an official nehuba api in the future */
                    this.listOfActiveLayers = []
                    let ngJson = this.nehubaViewer.config.dataset!.initialNgState
                    for (let key in ngJson.layers){
                        this.listOfActiveLayers.push(new LayerDescriptor(key,ngJson.layers[key]))
                    }

                    /* temporary measure */
                    this.darktheme = this.selectedTemplate.nehubaConfig.dataset!.imageBackground[0] < 0.5

                    this.nehubaViewer.applyInitialNgState()
                    this.nehubaViewer.relayout()
                    this.nehubaViewer.redraw()
                })
                
                /* currently the modal automatically hides after 3 seconds. */
                /* but in the future, we will be waiting for a signal from nehubaviewer */
                /* signalling that it is ok to hide the modal */
                setTimeout(()=>{
                    modal.hide()
                },3000)
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
        
        let loadPresetShaderSubject = this.eventCenter.createNewRelay()
        loadPresetShaderSubject.subscribe((resp:EventPacket)=>{
            switch(resp.code){
                case 200:{
                    layer.properties.shader = resp.body.code
                    /* no break statement... both causes unsubscription */
                }
                case 404:{
                    loadPresetShaderSubject.unsubscribe()
                }break;
            }
        })
        loadPresetShaderSubject.next(eventPacket)
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
        }
    }
}


