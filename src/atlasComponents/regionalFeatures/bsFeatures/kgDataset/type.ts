export type TCountedDataModality = {
  name: string
  occurance: number
  visible: boolean
}

export type TBSSummary = {
  ['@id']: string
  src_name: string
}

export type TBSDetail = TBSSummary & {
  __detail: {
    formats: string[]
    datasetDOI: {
      cite: string
      doi: string
    }[]
    activity: {
      protocols: string[]
      preparation: string[]
    }[]
    referenceSpaces: {
      name: string
      fullId: string
    }[]
    methods: string[]
    custodians: {
      "schema.org/shortName": string
      identifier: string
      name: string
      '@id': string
      shortName: string
    }[]
    project: string[]
    description: string
    parcellationAtlas: {
      name: string
      fullId: string
      id: string[]
    }[]
    licenseInfo: {
      name: string
      url: string
    }[]
    embargoStatus: {
      identifier: string[]
      name: string
      '@id': string
    }[]
    license: any[]
    parcellationRegion: {
      species: any[]
      name: string
      alias: string
      fullId: string
    }[]
    species: string[]
    name: string
    files: {
      byteSize: number
      name: string
      absolutePath: string
      contentType: string
    }[]
    fullId: string
    contributors: {
      "schema.org/shortName": string
      identifier: string
      name: string
      '@id': string
      shortName: string
    }[]
    id: string
    kgReference: string[] // aka doi
    publications: {
      name: string
      cite: string
      doi: string
    }[]
  }
}
