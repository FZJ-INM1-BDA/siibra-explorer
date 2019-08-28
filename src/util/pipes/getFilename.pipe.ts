import { PipeTransform, Pipe } from "@angular/core";

@Pipe({
  name: 'getFilenamePipe'
})

export class GetFilenamePipe implements PipeTransform{
  private regex: RegExp = new RegExp('[\\/\\\\]([\\w\\.]*?)$')
  public transform(fullname: string): string{
    return this.regex.test(fullname)
      ? this.regex.exec(fullname)[1]
      : fullname
  }
}