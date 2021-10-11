import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name : 'safeHtml',
})

export class SafeHtmlPipe implements PipeTransform {
  constructor(private ds: DomSanitizer){

  }
  public transform(html: string): SafeHtml {
    return this.ds.sanitize(SecurityContext.HTML, html)
  }
}
