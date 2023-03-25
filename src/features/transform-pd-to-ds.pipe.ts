import { CdkTableDataSourceInput } from '@angular/cdk/table';
import { Pipe, PipeTransform } from '@angular/core';
import { TabularFeature } from 'src/atlasComponents/sapi/sxplrTypes';

@Pipe({
  name: 'transformPdToDs',
  pure: true
})
export class TransformPdToDsPipe implements PipeTransform {

  transform(pd: TabularFeature<string|number|number[]>): CdkTableDataSourceInput<unknown> {
    return pd.data.map((arr, idx) => {
      const returnVal: Record<string, string|number|number[]> = {
        index: pd.index[idx],
      }
      arr.forEach((val, colIdx) => {
        returnVal[pd.columns[colIdx]] = val
      })
      return returnVal
    })
  }

}
