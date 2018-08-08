import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { dropdownAnimation } from "./dropdown.animation";

@Component({
  selector : 'dropdown',
  templateUrl : './dropdown.template.html',
  styleUrls : [
    `./dropdown.style.css`
  ],
  styles : [
    `
ul > li.selected > span:before
{
  content: '\u2022';
  width : 1em;
  display:inline-block;
}
ul > li:not(.selected) > span:before
{
  content: ' ';
  width : 1em;
  display:inline-block;
}  
    `
  ],
  animations:[
    dropdownAnimation
  ],
  changeDetection : ChangeDetectionStrategy.OnPush
})

export class DropdownComponent{

  @Input() inputArray : any[] = []
  @Input() selectedItem : any | null = null

  @Input() listDisplay : (obj:any)=>string = (obj)=>obj.name
  @Input() activeDisplay : (obj:any|null)=>string = (obj)=>obj ? obj.name : `Please select an item.`

  @Output() itemSelected : EventEmitter<any> = new EventEmitter()

  open : boolean = false
  isOpenChange(event:any){
    console.log(event)
  }
}