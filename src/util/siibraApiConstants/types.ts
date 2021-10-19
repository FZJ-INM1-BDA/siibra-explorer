type THref = {
  href: string
}

type TSpaceType = 'mri' | 'histology'

type TNgTransform = number[][]

type TVolumeType = 'nii' | 'neuroglancer/precomputed' | 'neuroglancer/precompmesh' | 'detailed maps' | 'threesurfer/gii' | 'threesurfer/gii-label'
type TParcModality = 'cytoarchitecture' | 'functional modes' | 'fibre architecture'

type TAuxMesh = {
  name: string
  labelIndicies: number[]
}

export interface IVolumeTypeDetail {
  'nii': null
  'neuroglancer/precomputed': {
    'neuroglancer/precomputed': {
      'labelIndex': number
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
  'threesurfer/gii': any
  'threesurfer/gii-label': any
}

export type TVolumeSrc<VolumeType extends keyof IVolumeTypeDetail> = {
  '@id': string
  '@type': 'fzj/tmp/volume_type/v0.0.1'
  name: string
  url: string
  volume_type: TVolumeType
  detail: IVolumeTypeDetail[VolumeType]

  space_id: string
  map_type: string
}

export type TSimpleInfo = {
  "@type": 'fzj/tmp/simpleOriginInfo/v0.0.1'
  name: string
  description: string
}


type TKgIdentifier = {
  kgSchema: string
  kgId: string
}

export type TKgInfo = {
  '@type': 'minds/core/dataset/v1.0.0'
} & TKgIdentifier

type TDatasetSpec = TVolumeSrc<keyof IVolumeTypeDetail> | TSimpleInfo | TKgInfo

type TVersion = {
  name: string
  prev: string | null
  next: string | null
  deprecated?: boolean
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

export type TDatainfoSummary = {
  '@type': 'minds/core/dataset/v1.0.0'
  kgSchema: string
  kgId: string
}

export type TDatainfosDetail = {
  '@type': 'minds/core/dataset/v1.0.0'
  name: string
  description: string
  urls: {
    cite: string
    doi: string
  }[]
  useClassicUi: boolean
}

export type TSpaceFull = {
  id: string
  name: string
  key: string //???
  _dataset_specs: TDatasetSpec[]
  _datasets_cached: null
  extends: null
  src_volume_type: TSpaceType
  type: string //???
  availableParcellations: TParcSummary[]

  links: {
    templates: THref
    parcellation_maps: THref
    features: THref
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
    extends: null
    key: string
    src_volume_type: 'histology' | 'mri'
    type: 'neuroglancer/precomputed' | 'nii'
    _dataset_specs: TDatasetSpec[]
  }[]
  links: {
    self: THref
  }
  regions: THref
  features: THref
  modality: TParcModality
  version: TVersion
  _dataset_specs: TDatasetSpec[]
}

export type TRegionSummary = {
  name: string
  labelIndex: number
  rgb: [number, number, number]
  id: number
  availableIn: {
    id: string
    name: string
  }[]
  _dataset_specs: (TVolumeSrc<keyof IVolumeTypeDetail> | TDatainfoSummary)[]
  children: TRegionSummary[]
}

export type TRegionDetail = {
  name: string
  labelIndex: number
  rgb: [number, number, number]
  id: {
    kg: TKgIdentifier
  }
  availableIn: {
    id: string
    name: string
  }[]
  _dataset_specs: (TVolumeSrc<keyof IVolumeTypeDetail> | TDatainfosDetail)[]

  children: TRegionDetail[]
  hasRegionalMap: boolean
  links: {
    [key: string]: string
  }
  props: {
    components: {
      centroid: [number, number, number]
      volume: number
    }[]
    space: any
  }
  
}

