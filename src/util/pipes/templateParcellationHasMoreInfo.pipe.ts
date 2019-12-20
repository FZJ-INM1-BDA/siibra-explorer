import { Pipe, PipeTransform } from "@angular/core";
import { IPublication } from "src/services/stateStore.service";

interface KgSchemaId {
  kgSchema: string
  kgId: string
}

interface MoreInfo {
  name: string
  description: string
  publications: IPublication[]
  originDatasets: KgSchemaId[]
  mindsId: KgSchemaId
}

const notNullNotEmptyString = (string) => !!string && string !== ''
const notEmptyArray = (arr) => !!arr && arr instanceof Array && arr.length > 0

@Pipe({
  name: 'templateParcellationHasMoreInfoPipe',
})

export class TemplateParcellationHasMoreInfo implements PipeTransform {
  public transform(obj: any): MoreInfo {

    const { description, properties = {}, publications, name, originDatasets, mindsId } = obj
    const { description: pDescriptions, publications: pPublications, name: pName, mindsId: pMindsId } = properties

    const hasMoreInfo = notNullNotEmptyString(description)
      || notNullNotEmptyString(pDescriptions)
      || notEmptyArray(publications)
      || notEmptyArray(pPublications)
      || notEmptyArray(originDatasets)

    return hasMoreInfo
      ? {
          name: pName || name,
          description: pDescriptions || description,
          publications: pPublications || publications,
          originDatasets: notEmptyArray(originDatasets)
            ? originDatasets
            : [{ kgSchema: null, kgId: null }],
          mindsId: pMindsId || mindsId,
        }
      : null
  }
}
