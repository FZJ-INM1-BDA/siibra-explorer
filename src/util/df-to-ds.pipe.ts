import { CdkTableDataSourceInput } from '@angular/cdk/table';
import { Pipe, PipeTransform } from '@angular/core';
import { components } from "src/atlasComponents/sapi/schemaV3"
type DF = components["schemas"]["DataFrameModel"]

function isDf(val: object): val is DF {
  if (!val) return false
  const keys = [
    "columns",
    "ndim",
    "data",
  ]
  return keys.every(key => key in val)
}

@Pipe({
  name: 'dfToDs',
  pure: true
})
export class DfToDsPipe implements PipeTransform {

  transform(df: object): CdkTableDataSourceInput<unknown> {
    if (!isDf(df)) {
      return null
    }
    return df.data.map((arr, idx) => {
      const val = df.index[idx] as any
      const returnVal: Record<string, string|number|number[]> = {
        index: val,
      }
      arr.forEach((val, colIdx) => {
        const key = df.columns[colIdx]
        if (!(typeof key === "string")) {
          throw new Error(`Expected key to be of type string,  number or number[], but was not`)
        }
        returnVal[key] = val
      })
      return returnVal
    })
  }

}