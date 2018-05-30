import { Component, OnChanges, Input, ChangeDetectionStrategy } from '@angular/core'
import * as showdown from 'showdown'

@Component({
  selector : 'markdown-dom',
  templateUrl : `./markdown.template.html`,
  styleUrls : [
    `./markdown.style.css`
  ],
  changeDetection : ChangeDetectionStrategy.OnPush
})

export class MarkdownDom implements OnChanges{

  @Input() markdown : string = ``
  private innerHtml : string = ``
  private converter = new showdown.Converter()
  constructor(){
    this.converter.setFlavor('github')
  }
  ngOnChanges(){
    this.innerHtml = this.converter.makeHtml(this.markdown)
  }
}
