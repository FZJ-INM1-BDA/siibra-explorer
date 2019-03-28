import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: 'radio-list',
  templateUrl: './radiolist.template.html',
  styleUrls: [
    './radiolist.style.css'
  ],
  styles: [
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
}