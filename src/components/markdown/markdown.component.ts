import { Component, OnChanges, Input, ChangeDetectionStrategy, ViewChild, ElementRef, OnInit } from '@angular/core'
import * as showdown from 'showdown'

@Component({
  selector : 'markdown-dom',
  templateUrl : `./markdown.template.html`,
  styleUrls : [
    `./markdown.style.css`
  ],
  changeDetection : ChangeDetectionStrategy.OnPush
})

export class MarkdownDom implements OnChanges,OnInit{

  @Input() markdown : string = ``
  public innerHtml : string = ``
  private converter = new showdown.Converter()

  constructor(){
    this.converter.setFlavor('github')
  }

  ngOnChanges(){
    this.innerHtml = this.converter.makeHtml(this.markdown)
  }

  ngOnInit(){
    if(this.contentWrapper.nativeElement.innerHTML.replace(/\w|\n/g,'') !== '')
      this.innerHtml = this.converter.makeHtml(this.contentWrapper.nativeElement.innerHTML)
  }

  @ViewChild('ngContentWrapper', { read : ElementRef})
  contentWrapper : ElementRef

}
