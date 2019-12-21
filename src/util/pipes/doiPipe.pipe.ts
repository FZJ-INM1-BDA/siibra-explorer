import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'doiParserPipe',
})

export class DoiParserPipe implements PipeTransform {
  public transform(s: string, prefix: string = 'https://doi.org/') {
    const hasProtocol = /^https?:\/\//.test(s)
    return `${hasProtocol ? '' : prefix}${s}`
  }
}
