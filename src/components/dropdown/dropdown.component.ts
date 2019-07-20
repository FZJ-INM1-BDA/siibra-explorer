import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener, ViewChild, ElementRef } from "@angular/core";
import { dropdownAnimation } from "./dropdown.animation";
import { HasExtraButtons, ExraBtnClickEvent, ExtraButton } from '../radiolist/radiolist.component'

@Component({
  selector : 'dropdown-component',
  templateUrl : './dropdown.template.html',
  styleUrls : [
    `./dropdown.style.css`
  ],
  animations:[
    dropdownAnimation
  ],
  changeDetection : ChangeDetectionStrategy.OnPush
})

export class DropdownComponent{

  @Input() activeDisplayBtns: ExtraButton[] = []
  @Output() activeDisplayBtnClicked: EventEmitter<{extraBtn: ExtraButton, event: MouseEvent}> = new EventEmitter()

  @Input() inputArray : HasExtraButtons[] = []
  @Input() selectedItem : any | null = null
  @Input() checkSelected: (selectedItem:any, item:any) => boolean = (si,i) => si === i

  @Input() listDisplay : (obj:any)=>string = (obj)=>obj.name
  @Input() activeDisplay : (obj:any|null)=>string = (obj)=>obj ? obj.name : `Please select an item.`

  @Output() itemSelected : EventEmitter<any> = new EventEmitter()
  @Output() extraBtnClicked: EventEmitter<ExraBtnClickEvent> = new EventEmitter()

  @ViewChild('dropdownToggle',{ read:ElementRef}) dropdownToggle : ElementRef

  openState : boolean = false

  @HostListener('document:click',['$event'])
  close(event:MouseEvent){
    const contains = this.dropdownToggle.nativeElement.contains(event.target)
    if(contains)
      this.openState = !this.openState
    else
      this.openState = false;
  }

  handleActiveDisplayBtnClick(btn: ExtraButton, event: MouseEvent){
    this.activeDisplayBtnClicked.emit({
      extraBtn: btn,
      event
    })
  }
}