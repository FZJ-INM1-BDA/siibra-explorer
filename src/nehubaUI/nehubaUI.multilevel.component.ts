import { Input, Output, EventEmitter,Component,AfterViewInit } from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'
import { Multilevel,EventPacket,RegionDescriptor } from './nehuba.model'
import { EventCenter } from './nehubaUI.services'

@Component({
    selector : 'multilevel',
    templateUrl : 'src/nehubaUI/templates/nehubaUI.multilevel.template.html',
    styles : [` 
        :host >>> span.highlight
        {
        background-color:#ff3
        }
    `],
    styleUrls : [   'src/nehubaUI/templates/nehubaUI.template.css',
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

export class MultilevelSelector implements AfterViewInit{

    @Input() searchTerm : string
    @Input() data : Multilevel[]
    @Input() selectedData : Multilevel[]
    @Output() callModal = new EventEmitter<Multilevel>()

    constructor(private eventCenter : EventCenter){}

    ngAfterViewInit():void{
        
    }

    isMultilevelSelected(data:Multilevel):void{
        //console.log( data )
        data
    }

    chooseLevel(data:RegionDescriptor):void{
        
        // if (data.default_loc){
        //     this.eventCenter.navigationRelay.next(new EventPacket('navigateTo',Date.now().toString(),100,{pos:data.default_loc}))
        // }
        // if (data.label_index){
        //     this.eventCenter.segmentSelectionRelay.next(new EventPacket('segmentSelection',Date.now().toString(),100,{segID:data.label_index}))
        // }
        if( data.hasEnabledChildren() ){
            data.updateChildrenStatus('disable')
            if (data.label_index){
                this.eventCenter.segmentSelectionRelay.next(new EventPacket('segmentSelection',Date.now().toString(),100,{segID:data.label_index,mode:"hide"}))
            }
        }else{
            data.updateChildrenStatus('enable')
            if (data.default_loc){
                this.eventCenter.navigationRelay.next(new EventPacket('navigateTo',Date.now().toString(),100,{pos:data.default_loc}))
            }
            if (data.label_index){
                this.eventCenter.segmentSelectionRelay.next(new EventPacket('segmentSelection',Date.now().toString(),100,{segID:data.label_index,mode:"show"}))
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

    callingModal(multilevel:Multilevel):void{
        this.callModal.emit( multilevel )
    }
}