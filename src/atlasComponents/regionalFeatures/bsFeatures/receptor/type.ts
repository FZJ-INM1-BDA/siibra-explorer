type TReceptorCommon = {
  latex: string
  markdown: string
  name: string
}

type TReceptor = string // TODO complete all possible neuroreceptor

type TReceptorSymbol = {
  [key: string]: {
    receptor: TReceptorCommon
    neurotransmitter: TReceptorCommon & { label: string }
  }
}

type TProfile = {
  [key: number]: number
}

type TBSFingerprint = {
  unit: string
  labels: TReceptor[]
  meanvals: number[]
  stdvals: number[]
  n: 1
}

export type TBSSummary = {
  ['@id']: string
  name: string
  info: string
  origin_datainfos?: ({
    name: string
    description: string
  } | {
    urls: {
      doi: string
      cite?: string
    }[]
  })[]
}

export type TBSDetail = TBSSummary & {
  __files: string[]
  __receptor_symbols: TReceptorSymbol
  __data: {
    __profiles: {
      [key: string]: TProfile
    }
    __autoradiographs: {
      [key: string]: string
    }
    __fingerprint: TBSFingerprint
    __profile_unit: string
  }
}
