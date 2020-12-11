import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'arrayContains',
  pure: true
})

export class ArrayContainsPipe implements PipeTransform{
  public transform<T>(inputArray: T[], qualifier: T): boolean{
    return (inputArray || []).some(it => it === qualifier)
  }
}
