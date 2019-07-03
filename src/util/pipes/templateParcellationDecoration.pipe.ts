import { Pipe, PipeTransform } from "@angular/core";

const notNullNotEmptyString = (string) => !!string && string !== ''
const notEmptyArray = (arr) => !!arr && arr instanceof Array && arr.length > 0

/**
 * extraButtons are needed to render (i) btn in dropdown menu
 * this pipe should append the extraButtons property according to:
 * - originalDatasets is defined
 * - description is defined on either root level or properties level
 */

@Pipe({
  name: 'templateParcellationsDecorationPipe'
})

export class TemplateParcellationsDecorationPipe implements PipeTransform{
  public transform(parcellations:any[]){
    return parcellations.map(p => {
      const { description, properties = {}, publications } = p
      const { description:pDescriptions, publications: pPublications } = properties
      const defaultOriginaldataset = notNullNotEmptyString(description)
        || notNullNotEmptyString(pDescriptions)
        || notEmptyArray(publications)
        || notEmptyArray(pPublications)
          ? [{}]
          : []

      const { originDatasets = defaultOriginaldataset } = p
      return {
        ...p,
        extraButtons: originDatasets
          .map(({ kgSchema, kgId }) => {
            return {
              name: getNameFromSchemaId({ kgSchema, kgId }),
              faIcon: 'fas fa-info-circle'
            }
          })
      }
    })
  }
}

export const getNameFromSchemaId = ({ kgSchema=null, kgId=null } = {}) => JSON.stringify({kgSchema, kgId})
export const getSchemaIdFromName = (string = '{}') => {
  const {kgSchema=null, kgId=null} = JSON.parse(string)
  return { kgSchema, kgId }
}