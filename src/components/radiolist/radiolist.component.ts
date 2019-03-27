import { Component, ChangeDetectionStrategy } from "@angular/core";

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
  
}