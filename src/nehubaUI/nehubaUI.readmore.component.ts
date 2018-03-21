import { Component, Input, ViewChild, ElementRef } from '@angular/core'
import { state,trigger,transition,style,animate } from '@angular/animations'

@Component({
  selector : `readmoreComponent`,
  template : 
  `
  <div container>
    <div 
      [@showReadmore]="{value:showAllState,params:{readMoreMaxheight:readMoreMaxHeight,containerHeight:containerHeight}}" content>
      <div #ngContentWrapper>
        <ng-content>
        </ng-content>
      </div>
    </div>
    <div (click) = "showAll = !showAll" readmoreSliver>
      <i *ngIf = "!showAll" class = "glyphicon glyphicon-chevron-down"></i>
      <i *ngIf = "showAll" class = "glyphicon glyphicon-chevron-up"></i>
    </div>
  </div>
  `,
  styles : [
    `
    div[container]
    {
      width:100%;
      overflow:hidden;
    }
    div[content]
    {
      width:100%;
      overflow:hidden;
    }
    div[readmoreSliver]
    {
      width:100%;
      height:15px;
      text-align:center;
    }
    div[readmoreSliver]:hover
    {
      cursor:pointer;
    }
    `
  ],
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
}