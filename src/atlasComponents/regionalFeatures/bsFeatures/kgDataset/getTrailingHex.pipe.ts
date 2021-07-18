import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getTrailingHex',
  pure: true
})

export class GetTrailingHexPipe implements PipeTransform{
  public transform(input: string) {
    const match = /[0-9a-f-]+$/.exec(input)
    return match && match[0]
  }
}