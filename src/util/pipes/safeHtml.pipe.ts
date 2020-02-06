import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name : 'safeHtml',
})

export class SafeHtmlPipe implements PipeTransform {
  public transform(html: string): string {
    return html
    // return this.ds.bypassSecurityTrustHtml(html)
  }
}
