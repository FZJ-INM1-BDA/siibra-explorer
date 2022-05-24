import { Pipe, PipeTransform, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Pipe({
  name: 'iframeSrc',
  pure: true
})

export class IFrameSrcPipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer){}

  transform(src: string): SafeResourceUrl {
    // https://angular.io/guide/security#sanitization-and-security-contexts
    // Sanitizing resource url isn't possible
    // hence bypassing
    return this.domSanitizer.bypassSecurityTrustResourceUrl(
      this.domSanitizer.sanitize(
        SecurityContext.URL,
        src
      )
    )
  }
}
