import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
  name : 'highlightPipe',
})

export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {

  }
  public transform(input: string, searchTerm: string) {
    return searchTerm && searchTerm !== ''
      ? this.sanitizer.bypassSecurityTrustHtml(input.replace(new RegExp( searchTerm, 'gi'), (s) => `<span class = "highlight">${s}</span>`))
      : input
  }
}
