import { Pipe, PipeTransform } from "@angular/core";

interface InRoi {
  key: string
  value: {
    inRoi: boolean
  }
}

@Pipe({
  name: 'inRoi',
  pure: true
})

export class InRoiPipe implements PipeTransform{
  public transform(list: InRoi[], inroi=true): InRoi[] {
    return list.filter(it => it.value.inRoi === inroi)
  }
}
