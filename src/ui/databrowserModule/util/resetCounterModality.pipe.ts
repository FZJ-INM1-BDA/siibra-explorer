import { Pipe, PipeTransform } from "@angular/core";
import { CountedDataModality } from "../databrowser.service";

@Pipe({
  name: 'resetcounterModalityPipe'
})

export class ResetCounterModalityPipe implements PipeTransform{
  public transform(inc: CountedDataModality[]):CountedDataModality[]{
    return inc.map(({ occurance, ...rest }) => {
      return {
        occurance: 0,
        ...rest
      }
    })
  }
}