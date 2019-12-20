import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name : 'safeHtml',
})

export class SafeHtmlPipe implements PipeTransform {
  constructor() {

  }

  public transform(html: string): string {
    return html
    // return this.ds.bypassSecurityTrustHtml(html)
  }
}
