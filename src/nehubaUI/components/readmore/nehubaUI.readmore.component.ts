import { Component, Input, ViewChild, ElementRef } from '@angular/core'
import { state,trigger,transition,style,animate } from '@angular/animations'

import template from './nehubaUI.readmore.template.html'
import css from './nehubaUI.readmore.style.css'

@Component({
  selector : `readmoreComponent`,
  template : template ,
  styles : [ css ],
  animations : [
    trigger('showReadmore',[
      state('collapse',
        style({'height':'{{ readMoreMaxheight }}'}),
        {
          params:{
            readMoreMaxheight : '4em'
          }
        }),
      state('show',
        style({'height':'{{ containerHeight }}'}),
        {
          params:{
            containerHeight : '50em'
          }
        }),
      transition('collapse => show',[
        style({'height':'{{ readMoreMaxheight }}'}),
        animate('150ms ease-out',style({'height':'{{ containerHeight }}'}))
      ]),
      transition('show => collapse',[
        style({'height':'{{ containerHeight }}'}),
        animate('150ms ease-out',style({'height':'{{ readMoreMaxheight }}'}))
      ])
    ])
  ]
})

export class ReadMoreComponent{
  /* wrap content to see effect */
  @Input() readMoreMaxHeight : string = '4em'
  @Input() showAll : boolean = false
  @ViewChild('ngContentWrapper')ngContentWrapper : ElementRef

  get containerHeight(){
    return `${this.ngContentWrapper.nativeElement.offsetHeight + 15}px`
  }

  get actualHeight(){
    return this.showAll ? `${this.ngContentWrapper.nativeElement.offsetHeight + 15}px` : this.readMoreMaxHeight
  }

  get showAllState(){
    return this.showAll ? 'show' : 'collapse'
  }

  toggleShow(ev:Event){
    this.showAll = !this.showAll
    ev.stopPropagation()
  }
}