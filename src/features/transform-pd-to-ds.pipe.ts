import { CdkTableDataSourceInput } from '@angular/cdk/table';
import { Pipe, PipeTransform } from '@angular/core';
import { TabularFeature } from 'src/atlasComponents/sapi/sxplrTypes';

function typeGuard(input: unknown): input is string | number | number[]{
  return typeof input === "string" || typeof input === "number" || (Array.isArray(input) && input.every(v => typeof v === "number"))
}

function isString(input: unknown): input is string {
  return typeof input === "string"
}

@Pipe({
  name: 'transformPdToDs',
  pure: true
})
export class TransformPdToDsPipe implements PipeTransform {

  transform(pd: TabularFeature<string|number|number[]>): CdkTableDataSourceInput<unknown> {
    return pd.data.map((arr, idx) => {
      const val = pd.index[idx]
      if (!typeGuard(val)) {
        throw new Error(`Expected val to be of type string, number or number[], but was none.`)
      }
      const returnVal: Record<string, string|number|number[]> = {
        index: val,
      }
      arr.forEach((val, colIdx) => {
        const key = pd.columns[colIdx]
        if (!isString(key)) {
          throw new Error(`Expected key to be of type string,  number or number[], but was not`)
        }
        returnVal[key] = val
      })
      return returnVal
    })
  }

}
