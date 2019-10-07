import { PipeTransform, Pipe, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Pipe({
  name: 'transformOnhoverSegment'
})

export class TransformOnhoverSegmentPipe implements PipeTransform{
  constructor(private sanitizer:DomSanitizer){

  }

  private getStatus(text:string) {
    return ` <span class="text-muted">(${this.sanitizer.sanitize(SecurityContext.HTML, text)})</span>`
  }

  public transform(segment: any | number): SafeHtml{
    return this.sanitizer.bypassSecurityTrustHtml((
      (segment.name || segment) +
      (segment.status
        ? this.getStatus(segment.status)
        : '')
    ))
  }
}