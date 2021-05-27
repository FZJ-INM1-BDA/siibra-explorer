type THref = {
  href: string
}

type TSpaceType = 'mri' | 'histology'

type TNgTransform = number[][]

type TVolumeType = 'nii' | 'neuroglancer/precomputed' | 'neuroglancer/precompmesh' | 'detailed maps'
type TParcModality = 'cytoarchitecture' | 'functional modes' | 'fibre architecture'

type TAuxMesh = {
  name: string
  labelIndicies: number[]
}

interface IVolumeTypeDetail {
  'nii': null
  'neuroglancer/precomputed': {
    'neuroglancer/precomputed': {
      'transform': TNgTransform
    }
  }
  'neuroglancer/precompmesh': {
    'neuroglancer/precompmesh': {
      'auxMeshes': TAuxMesh[]
      'transform': TNgTransform
    }
  }
  'detailed maps': null
}

type TVolumeSrc<VolumeType extends keyof IVolumeTypeDetail> = {
  '@id': string
  '@type': 'fzj/tmp/volume_type/v0.0.1'
  name: string
  url: string
  volume_type: TVolumeType
  detail: IVolumeTypeDetail[VolumeType]
}

type TKgIdentifier = {
  kgSchema: string
  kgId: string
}

type TVersion = {
  name: string
  prev: string | null
  next: string | null
}

export type TId = string | { kg: TKgIdentifier }

export type TAtlas = {
  id: string
  name: string
  links: {
    parcellations: THref
    spaces: THref
  }
}

export type TSpaceSummary = {
  id: {
    kg: TKgIdentifier
  }
  name: string
  links: {
    self: THref
  }
}

export type TParcSummary = {
  id: string
  name: string
}

export type TSpaceFull = {
  id: string
  name: string
  key: string //???
  type: string //???
  url: string //???
  ziptarget: string //???
  src_volume_type: TSpaceType
  volume_src: TVolumeSrc<keyof IVolumeTypeDetail>[]
  availableParcellations: TParcSummary[]
  links: {
    templates: THref
    parcellation_maps: THref
  }
}

export type TParc = {
  id: {
    kg: TKgIdentifier
  }
  name: string
  availableSpaces: {
    id: string
    name: string
  }[]
  links: {
    self: THref
  }
  regions: THref
  modality: TParcModality
  version: TVersion
  volumeSrc: {
    [key: string]: {
      [key: string]: TVolumeSrc<keyof IVolumeTypeDetail>[]
    }
  }
}

export type TRegionDetail = {
  name: string
  children: TRegionDetail[]
  rgb: number[]
  id: string
  labelIndex: number
  volumeSrc: {
    [key: string]: {
      [key: string]: TVolumeSrc<keyof IVolumeTypeDetail>[]
    }
  }
  availableIn: {
    id: string
    name: string
  }[]
  hasRegionalMap: boolean
  props: {
    centroid_mm: number[]
    volume_mm: number
    surface_mm: number
    is_cortical: number
  }
  links: {
    [key: string]: string
  }
}

export type TRegion = {
  name: string
  children: TRegion[]
  volumeSrc: {
    [key: string]: {
      [key: string]: TVolumeSrc<keyof IVolumeTypeDetail>[]
    }
  }

  labelIndex?: number
  rgb?: number[]
  id?: {
    kg: TKgIdentifier
  }

  /**
   * missing 
   */

  originDatasets?: ({
    filename: string
  } & TKgIdentifier) []

  position?: number[]
}
