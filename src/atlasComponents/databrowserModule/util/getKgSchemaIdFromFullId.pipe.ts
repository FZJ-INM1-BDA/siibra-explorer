import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getKgSchemaIdFromFullIdPipe',
})

export class GetKgSchemaIdFromFullIdPipe implements PipeTransform {
  public transform(fullId: string): [string, string] {
    return getKgSchemaIdFromFullId(fullId)
  }
}

export function getKgSchemaIdFromFullId(fullId: string): [string, string]{
  if (!fullId) { return [null, null] }
  const match = /([\w\-.]*\/[\w\-.]*\/[\w\-.]*\/[\w\-.]*)\/([\w\-.]*)$/.exec(fullId)
  if (!match) { return [null, null] }
  return [match[1], match[2]]
}