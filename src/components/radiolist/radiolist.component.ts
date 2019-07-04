import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ViewChild, TemplateRef } from "@angular/core";

@Component({
  selector: 'radio-list',
  templateUrl: './radiolist.template.html',
  styleUrls: [
    './radiolist.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RadioList{
  @Input() 
  listDisplay : (item:any) => string = (obj) => obj.name

  @Output()
  itemSelected : EventEmitter<any> = new EventEmitter()

  @Input()
  selectedItem: any | null = null

  @Input()
  inputArray: HasExtraButtons[] = []

  @Input()
  ulClass: string = ''
  
  @Input() checkSelected: (selectedItem:any, item:any) => boolean = (si,i) => si === i

  @Output() extraBtnClicked = new EventEmitter<ExraBtnClickEvent>()

  handleExtraBtnClick(extraBtn:ExtraButton, inputItem:any, event:MouseEvent){
    this.extraBtnClicked.emit({
      extraBtn,
      inputItem,
      event
    })
  }

  overflowText(event) {
    return (event.offsetWidth < event.scrollWidth)
  }
}

export interface ExtraButton{
  name: string,
  faIcon: string
  class?: string
}

export interface HasExtraButtons{
  extraButtons?: ExtraButton[]
}

export interface ExraBtnClickEvent{
  extraBtn:ExtraButton
  inputItem:any
  event:MouseEvent
}