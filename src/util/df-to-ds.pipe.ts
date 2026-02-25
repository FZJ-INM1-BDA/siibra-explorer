import { CdkTableDataSourceInput } from '@angular/cdk/table';
import { Pipe, PipeTransform } from '@angular/core';
import { MatSort, MatTableDataSource } from 'src/sharedModules/angularMaterial.exports'
import { components } from "src/atlasComponents/sapi/schemaV3"
type DF = components["schemas"]["DataFrameModel"]

function isDf(val: object|null): val is DF {
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

  transform(df: object|null, sort: MatSort): CdkTableDataSourceInput<unknown> {
    if (!isDf(df)) {
      return null
    }
    if (!df.data) {
      return null
    }
    const v = df.data.map((arr, idx) => {
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
    const ds = new MatTableDataSource(v)
    ds.sort = sort
    return ds
  }

}
