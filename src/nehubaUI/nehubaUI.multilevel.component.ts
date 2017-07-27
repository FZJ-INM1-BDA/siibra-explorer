import { Input, Output, EventEmitter,Component,AfterViewInit } from '@angular/core'
import { trigger, state, style, animate, transition } from '@angular/animations'
import { Multilevel } from './nehuba.model'
// import { SearchHighlight } from './nehubaUI.util.pipes'

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
            transition('collapsed <=> expanded',animate('300ms'))
        ]),
        trigger('multilvlArrow',[
            state('collapsed',style({
                transform:'rotate(-45deg)'
            })),
            state('expanded',style({
            })),
            transition('collapsed <=> expanded',animate('100ms'))
        ])
    ]
})

export class MultilevelSelector implements AfterViewInit{

    @Input() searchTerm : string
    @Input() data : Multilevel[]
    @Input() selectedData : Multilevel[]
    @Output() callModal = new EventEmitter<Multilevel>()

    ngAfterViewInit():void{
        
    }

    isMultilevelSelected(data:Multilevel):void{
        //console.log( data )
        data
    }

    chooseLevel(data:Multilevel):void{
        
        if( data.hasEnabledChildren() ){
            data.updateChildrenStatus('disable')
        }else{
            data.updateChildrenStatus('enable')
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