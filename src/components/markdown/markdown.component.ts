import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core'
import * as showdown from 'showdown'

@Component({
  selector : 'markdown-dom',
  templateUrl : `./markdown.template.html`,
  styleUrls : [
    `./markdown.style.css`,
  ],
  changeDetection : ChangeDetectionStrategy.OnPush,
})

export class MarkdownDom implements OnChanges, OnInit {

  @Input() public markdown: string = ``
  public innerHtml: string = ``
  private converter = new showdown.Converter()

  constructor() {
    this.converter.setFlavor('github')
  }

  public ngOnChanges() {
    this.innerHtml = this.converter.makeHtml(this.markdown)
  }

  public ngOnInit() {
    if (this.contentWrapper.nativeElement.innerHTML.replace(/\w|\n/g, '') !== '') {
      this.innerHtml = this.converter.makeHtml(this.contentWrapper.nativeElement.innerHTML)
    }
  }

  @ViewChild('ngContentWrapper', {read : ElementRef, static: true})
  public contentWrapper: ElementRef

}
