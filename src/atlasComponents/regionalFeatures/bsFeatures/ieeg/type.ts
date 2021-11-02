export type TBSSummary = {
  '@id': string
  name: string
  description: string
}

export type TContactPoint = {
  id: string
  location: [number, number, number]
  inRoi?: boolean
}

export type TElectrode = {
  electrode_id: string
  subject_id: string
  contact_points: {
    [key: string]: TContactPoint
  }
  inRoi?: boolean
}

export type TBSIeegSessionSummary = {
  '@id': string
  name: string
  description: string
  origin_datainfos: {
    urls: {
      doi: string
    }[]
  }[]
}

type TDetail = {
  sub_id: string
  electrodes: {
    [key: string]: TElectrode
  }
  inRoi?: boolean
}

export type TBSIeegSessionDetail = TBSIeegSessionSummary & TDetail

export const SIIBRA_FEATURE_KEY = 'IEEG_Session'
export const _SIIBRA_FEATURE_KEY = 'IEEG_Electrode'
export const IEEG_FEATURE_NAME = 'iEEG recordings'
