import { PipeTransform, Pipe, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Pipe({
  name: 'transformOnhoverSegment'
})

export class TransformOnhoverSegmentPipe implements PipeTransform{
  constructor(private sanitizer:DomSanitizer){

  }

  private sanitizeHtml(inc:string):SafeHtml{
    return this.sanitizer.sanitize(SecurityContext.HTML, inc)
  }

  private getStatus(text:string) {
    return ` <span class="text-muted">(${this.sanitizeHtml(text)})</span>`
  }

  public transform(segment: any | number): SafeHtml{
    return this.sanitizer.bypassSecurityTrustHtml((
      ( this.sanitizeHtml(segment.name) || segment) +
      (segment.status
        ? this.getStatus(segment.status)
        : '')
    ))
  }
}