import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getId',
  pure: true
})

export class GetIdPipe implements PipeTransform{
  public transform(fullId: string): string{
    const re = /\/([a-f0-9-]+)$/.exec(fullId)
    return (re && re[1]) || null
  }
}
