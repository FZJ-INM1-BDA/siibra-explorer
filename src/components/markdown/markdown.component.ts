import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, ChangeDetectorRef, AfterViewChecked } from '@angular/core'
import * as showdown from 'showdown'

@Component({
  selector : 'markdown-dom',
  templateUrl : `./markdown.template.html`,
  styleUrls : [
    `./markdown.style.css`,
  ],
  changeDetection : ChangeDetectionStrategy.OnPush,
})

export class MarkdownDom implements AfterViewChecked {

  @Input() public markdown: string = ``
  public innerHtml: string = ``
  private converter = new showdown.Converter()

  constructor(
    private cdr: ChangeDetectorRef
  ) {
    this.converter.setFlavor('github')
  }

  private getMarkdown(){
    if (this.markdown) return this.markdown
    if (this.contentWrapper.nativeElement.innerHTML.replace(/\w|\n/g, '') !== '') return this.contentWrapper.nativeElement.innerHTML
    return ''
  }

  public ngAfterViewChecked(){
    this.innerHtml = this.converter.makeHtml(
      this.getMarkdown()
    )
    this.cdr.detectChanges()
  }

  @ViewChild('ngContentWrapper', {read : ElementRef, static: true})
  public contentWrapper: ElementRef

}
