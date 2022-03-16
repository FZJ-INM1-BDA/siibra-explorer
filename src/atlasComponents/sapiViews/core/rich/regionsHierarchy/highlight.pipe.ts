import { Pipe, PipeTransform, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Pipe({
  name: 'hightlightPipe',
  pure: true
})

export class HighlightPipe implements PipeTransform {
  
  constructor(private sanitizer: DomSanitizer){}

  transform(input: string, highlight: string = ''): SafeHtml {
    let regex: RegExp
    if (highlight === '') return input
    try {
      regex = new RegExp(highlight, 'i')
    } catch (e) {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
      // CC0 or MIT
      regex = new RegExp(highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    }
    return this.sanitizer.sanitize(
      SecurityContext.HTML,
      input.replace(regex, s => `<mark>${s}</mark>`)
    )
  }
}