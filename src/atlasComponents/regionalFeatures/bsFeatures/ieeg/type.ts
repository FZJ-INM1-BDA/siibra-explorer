export type TBSSummary = {
  '@id': string
  'name': string
}

export type TContactPoint = {
  'id': string
  'coord': [number, number, number]
  'inRoi'?: boolean
}

export type TElectrode = {
  id: string
  subject_id: string
  __contact_points: {
    [key: string]: TContactPoint
  }
  inRoi: boolean
}

export type TBSDEtail = {
  '__kg_id': string
  '__electrodes': {
    [key: string]: TElectrode
  }
}
export type _TBSDEtail = {
  '__kg_id': string
  '__contact_points': {
    [key: string]: TContactPoint
  }
}

export const SIIBRA_FEATURE_KEY = 'IEEG_Dataset'
export const _SIIBRA_FEATURE_KEY = 'IEEG_Electrode'
export const IEEG_FEATURE_NAME = 'iEEG recordings'
