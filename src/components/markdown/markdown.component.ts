import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, ChangeDetectorRef, AfterViewChecked, OnChanges } from '@angular/core'
import * as showdown from 'showdown'

@Component({
  selector : 'markdown-dom',
  templateUrl : `./markdown.template.html`,
  styleUrls : [
    `./markdown.style.css`,
  ],
  changeDetection : ChangeDetectionStrategy.OnPush,
})

export class MarkdownDom implements OnChanges {

  @Input() public markdown: string = ``
  public innerHtml: string = ``
  private converter = new showdown.Converter({
    tables: true
  })

  constructor(
    private cdr: ChangeDetectorRef
  ) {
    this.cdr.detach()
    this.converter.setFlavor('github')
  }

  private getMarkdown(){
    if (this.markdown) return this.markdown
    if (this.contentWrapper.nativeElement.innerHTML.replace(/\w|\n/g, '') !== '') return this.contentWrapper.nativeElement.innerHTML
    return ''
  }

  ngOnChanges(){
    this.innerHtml = this.converter.makeHtml(
      this.getMarkdown()
    )
    this.cdr.detectChanges()
  }

  @ViewChild('ngContentWrapper', {read : ElementRef, static: true})
  public contentWrapper: ElementRef

}
