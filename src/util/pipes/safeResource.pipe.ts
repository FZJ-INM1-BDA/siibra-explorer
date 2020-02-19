import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Pipe({
  name: 'safeResource'
})

export class SafeResourcePipe implements PipeTransform{
  constructor(
    private ds: DomSanitizer
  ){

  }

  transform(input:string): SafeResourceUrl{
    return this.ds.bypassSecurityTrustResourceUrl(input)
  }
}