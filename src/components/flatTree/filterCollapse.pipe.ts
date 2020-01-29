import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'filterCollapsePipe',
})

export class FilterCollapsePipe implements PipeTransform {
  public transform(array: any[], collapsedLevels: Set<string>, uncollapsedLevels: Set<string>, defaultCollapse: boolean ) {
    const isCollapsedById = (id) => {

      return collapsedLevels.has(id)
        ? true
        : uncollapsedLevels.has(id)
          ? false
          : !defaultCollapse
    }
    const returnArray =  array.filter(item => {
      return !item.lvlId.split('_')
        .filter((v, idx, arr) => idx < arr.length - 1 )
        .reduce((acc, curr) => acc
          .concat(acc.length === 0
            ? curr
            : acc[acc.length - 1].concat(`_${curr}`)), [])
        .some(id => isCollapsedById(id))
    })
    return returnArray
  }
}
