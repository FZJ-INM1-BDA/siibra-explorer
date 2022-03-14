import { Pipe, PipeTransform } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi/type";

export function getTraverseFunctions(parcellations: SapiParcellationModel[]) {

  const getTraverse = (key: 'prev' | 'next') => (parc: SapiParcellationModel) => {
    if (!parc.version) {
      throw new Error(`parcellation ${parc.name} does not have version defined!`)
    }
    if (!parc.version[key]) {
      return null
    }
    const found = parcellations.find(p => p["@id"] === parc.version[key]["@id"])
    if (!found) {
      throw new Error(`parcellation ${parc.name} references ${parc.version[key]['@id']} as ${key} version, but it cannot be found.`)
    }
    return found
  }
  
  const findNewer = getTraverse('next')
  const findOlder = getTraverse('prev')

  const getFindMostFn = (findNewest) => {
    const useFn = findNewest
      ? findNewer
      : findOlder
    return () => {
      let cursor = parcellations[0]
      let returnParc: SapiParcellationModel
      while (cursor) {
        returnParc = cursor
        cursor = useFn(cursor)
      }
      return returnParc
    }
  }

  return {
    findNewer,
    findOlder,
    findNewest: getFindMostFn(true),
    findOldest: getFindMostFn(false)
  }
  
}


@Pipe({
  name: 'orderParcellationByVersion',
  pure: true
})

export class OrderParcellationByVersionPipe implements PipeTransform{
  public transform(parcellations: SapiParcellationModel[], newestFirst: boolean = true, index: number = 0) {
    const {
      findNewer,
      findOlder
    } = getTraverseFunctions(parcellations)

    const findMostFn = newestFirst ? findNewer : findOlder
    const tranverseFn = newestFirst ? findOlder : findNewer

    const mostParc = (() => {
      let cursor = parcellations[0]
      let returnParc: SapiParcellationModel
      while (cursor) {
        returnParc = cursor
        cursor = findMostFn(cursor)
      }
      return returnParc
    })()

    let idx = 0
    let cursor = mostParc
    while (idx < index) {
      cursor = tranverseFn(cursor)
      if (!cursor) {
        throw new Error(`index out of bound`)
      }
      idx ++
    }
    return cursor
  }
}
