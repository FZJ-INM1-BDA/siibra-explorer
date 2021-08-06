import { InjectionToken } from "@angular/core"
import { Observable } from "rxjs"
import { IHasId } from "./util/interfaces"

/**
 * TODO gradually move to relevant.
 */

export const OVERRIDE_IAV_DATASET_PREVIEW_DATASET_FN = new InjectionToken<(file: any, dataset: any) => void>('OVERRIDE_IAV_DATASET_PREVIEW_DATASET_FN')
export const GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME = new InjectionToken<({ datasetSchema, datasetId, filename }) => Observable<any|null>>('GET_KGDS_PREVIEW_INFO_FROM_ID_FILENAME')
export const kgTos = `The interactive viewer queries HBP Knowledge Graph Data Platform ("KG") for published datasets.


Access to the data and metadata provided through KG requires that you cite and acknowledge said data and metadata according to the Terms and Conditions of the Platform.


Citation requirements are outlined <https://www.humanbrainproject.eu/en/explore-the-brain/search-terms-of-use#citations> .


Acknowledgement requirements are outlined <https://www.humanbrainproject.eu/en/explore-the-brain/search-terms-of-use#acknowledgements>


These outlines are based on the authoritative Terms and Conditions are found <https://www.humanbrainproject.eu/en/explore-the-brain/search-terms-of-use>


If you do not accept the Terms & Conditions you are not permitted to access or use the KG to search for, to submit, to post, or to download any materials found there-in.
`

export function getKgSchemaIdFromFullId(fullId: string): [string, string]{
  if (!fullId) { return [null, null] }
  const match = /([\w\-.]*\/[\w\-.]*\/[\w\-.]*\/[\w\-.]*)\/([\w\-.]*)$/.exec(fullId)
  if (!match) { return [null, null] }
  return [match[1], match[2]]
}


export interface IKgReferenceSpace {
  name: string
}

export interface IKgPublication {
  name: string
  doi: string
  cite: string
}

export interface IKgParcellationRegion {
  id?: string
  name: string
}

export interface IKgActivity {
  methods: string[]
  preparation: string[]
  protocols: string[]
}

export interface IKgDataEntry {
  activity: IKgActivity[]
  name: string
  description: string
  license: string[]
  licenseInfo: string[]
  parcellationRegion: IKgParcellationRegion[]
  formats: string[]
  custodians: string[]
  contributors: string[]
  referenceSpaces: IKgReferenceSpace[]
  files: File[]
  publications: IKgPublication[]
  embargoStatus: IHasId[]

  methods: string[]
  protocols: string[]

  preview?: boolean

  /**
   * TODO typo, should be kgReferences
   */
  kgReference: string[]

  id: string
  fullId: string
}

export type TypePreviewDispalyed = (file, dataset) => Observable<boolean>
export const IAV_DATASET_PREVIEW_ACTIVE = new InjectionToken<TypePreviewDispalyed>('IAV_DATASET_PREVIEW_ACTIVE')


export enum EnumPreviewFileTypes{
  NIFTI,
  IMAGE,
  CHART,
  OTHER,
  VOLUMES,
}

export interface DatasetPreview {
  datasetId: string
  filename: string
}

export function determinePreviewFileType(previewFile: any): EnumPreviewFileTypes {
  if (!previewFile) throw new Error(`previewFile is required to determine the file type`)
  const { mimetype, data } = previewFile
  const chartType = data && data['chart.js'] && data['chart.js'].type
  const registerdVolumes = data && data['iav-registered-volumes']
  if ( mimetype === 'application/nifti' ) { return EnumPreviewFileTypes.NIFTI }
  if ( /^image/.test(mimetype)) { return EnumPreviewFileTypes.IMAGE }
  if ( /application\/json/.test(mimetype) && (chartType === 'line' || chartType === 'radar')) { return EnumPreviewFileTypes.CHART }
  if ( /application\/json/.test(mimetype) && !!registerdVolumes) { return EnumPreviewFileTypes.VOLUMES }
  return EnumPreviewFileTypes.OTHER
}
