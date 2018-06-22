import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  name : 'getFilenameFromPathname'
})

export class GetFilenameFromPathnamePipe implements PipeTransform{
  public transform(pathname:string):string{
    return pathname.split('/')[pathname.split('/').length - 1]
  }
}