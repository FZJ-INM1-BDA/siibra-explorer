import { Pipe, PipeTransform } from "@angular/core"
import { GroupedParcellation } from "./groupedParcellation"

export function isGroupedParcellation(input: unknown): input is GroupedParcellation{
  return (input as any)['parcellations'] instanceof Array
}

@Pipe({
  name: 'isGroupedParcellation',
  pure: true
})

export class IsGroupedParcellation implements PipeTransform{
  public transform(input: unknown): input is GroupedParcellation {
    return isGroupedParcellation(input)
  }
}
