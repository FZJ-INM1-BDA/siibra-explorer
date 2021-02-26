type TReceptorCommon = {
  latex: string
  markdown: string
  name: string
}

type TReceptor = string // TODO complete all possible neuroreceptor

type TReceptorSymbol = {
  [key: string]: {
    receptor: TReceptorCommon,
    neurotransmitter: TReceptorCommon & { label: string }
  }
}

type TProfile = {
  [key: number]: number
}

type THasName = {
  name: string
}

type TBSFingerprint = {
  unit: string
  labels: TReceptor[]
  meanvals: number[]
  stdvals: number[]
  n: 1
}

type TBSData = {
  "region": string
  "active": boolean
  "name": string
  "urls": string[] // array of urls
  "info": string // md of desc of dataset
  "modality": THasName[]
  "_ReceptorDistribution__profiles": {
    [key: string]: TProfile
  } // key is receptor key
  "_ReceptorDistribution__autoradiographs": {
    [key: string]: string
  } // value is tiff image URL
  "_ReceptorDistribution__fingerprint": TBSFingerprint
  "_ReceptorDistribution__profile_unit": string
}

export type TBSResp = {
  data: TBSData
  receptor_symbols: TReceptorSymbol
}
