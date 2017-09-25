import { Input, Component } from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'
import { Multilevel,EventPacket,RegionDescriptor } from './nehuba.model'
import { EventCenter,EVENTCENTER_CONST } from './nehubaUI.services'

@Component({
    selector : 'multilevel',
    templateUrl : 'src/nehubaUI/templates/nehubaUI.multilevel.template.html',
    styles : [` 
        :host >>> span.highlight
        {
        background-color:#770;
        }
    `],
    styleUrls : [   
                    'src/nehubaUI/templates/nehubaUI.multilevel.template.css'],
    animations : [
        trigger('multilvlExpansion',[
            state('collapsed',style({
                height : '0em'
            })),
            state('expanded',style({

            })),
            transition('collapsed <=> expanded',animate('0ms'))
        ]),
        trigger('multilvlArrow',[
            state('collapsed',style({
                transform:'rotate(-45deg)'
            })),
            state('expanded',style({
            })),
            transition('collapsed <=> expanded',animate('0ms'))
        ])
    ]
})

export class MultilevelSelector {

    @Input() searchTerm : string
    @Input() data : Multilevel[]
    @Input() selectedData : Multilevel[]

    constructor(private eventCenter : EventCenter){}

    chooseLevel(data:RegionDescriptor):void{
        
        //TODO: fix trans location when more regions have their index and id
        if( data.hasEnabledChildren() ){
            data.updateChildrenStatus('disable')
            if (data.labelIndex){
                this.eventCenter.nehubaViewerRelay.next(
                    new EventPacket(
                        EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.HIDE_SEGMENT,
                        Date.now().toString(),
                        100,
                        {segID:data.labelIndex}
                    ))
                // this.eventCenter.segmentSelectionRelay.next(new EventPacket('segmentSelection',Date.now().toString(),100,{segID:data.label_index,mode:"hide"}))
            }
        }else{
            data.updateChildrenStatus('enable')
            console.log(data)
            if (data.position){
                this.eventCenter.nehubaViewerRelay.next(
                    new EventPacket(
                        EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.NAVIGATE,
                        Date.now().toString(),
                        100,
                        {pos:data.position}
                    ))
            }
            if (data.labelIndex){
                this.eventCenter.nehubaViewerRelay.next(
                    new EventPacket(
                        EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.SHOW_SEGMENT,
                        Date.now().toString(),
                        100,
                        {segID:data.labelIndex}
                    ))
            }
        }
    }

    expandMultilvl(m:Multilevel,event:any):void{
        m.isExpanded = !m.isExpanded
        m.isExpanded ? m.isExpandedString = 'expanded' : m.isExpandedString = 'collapsed'
        event.stopPropagation()
    }

    iterativeVisible(singleData:any):boolean{
        return singleData.children.some( (child:any)=>child.isVisible || this.iterativeVisible( child ))
    }

    ShowPMap(singleData:RegionDescriptor){
        if (singleData.position){
            this.eventCenter.nehubaViewerRelay.next(
                new EventPacket(
                    EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.NAVIGATE,
                    Date.now().toString(),
                    100,
                    {pos:singleData.position}
                ))
        }
        this.eventCenter.nehubaViewerRelay.next(
            new EventPacket(EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.LOAD_LAYER,'',100,{
                url:singleData.PMapURL,
                title:singleData.name
            }))    
    }

    callingModal(regionDescriptor:RegionDescriptor):void{
        this.eventCenter.modalEventRelay.next(new EventPacket('showInfoModal',Date.now().toString(),100,{title:regionDescriptor.name,body:regionDescriptor.properties}))
    }
}