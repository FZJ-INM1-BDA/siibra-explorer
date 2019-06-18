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
  inputArray: any[] = []

  @Input()
  ulClass: string = ''
  
  @Input() checkSelected: (selectedItem:any, item:any) => boolean = (si,i) => si === i

  @Input() isMobile: boolean
  @Input() darktheme: boolean

  @Output() listItemButtonClicked = new EventEmitter<string>();

  clickListButton(i) {
    this.listItemButtonClicked.emit(i)
  }

  overflowText(event) {
    return (event.offsetWidth < event.scrollWidth)
  }
}