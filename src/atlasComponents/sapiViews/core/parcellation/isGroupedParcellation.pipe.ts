import { Pipe, PipeTransform } from "@angular/core"
import { GroupedParcellation } from "./groupedParcellation"

@Pipe({
  name: 'isGroupedParcellation',
  pure: true
})

export class IsGroupedParcellation implements PipeTransform{
  public transform(input: unknown): input is GroupedParcellation {
    return input['parcellations'] instanceof Array
  }
}
