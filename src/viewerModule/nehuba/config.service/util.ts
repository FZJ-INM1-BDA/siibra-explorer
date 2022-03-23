import { SapiParcellationModel, SapiSpaceModel, SapiAtlasModel, SapiRegionModel, SAPI } from 'src/atlasComponents/sapi'
import { SapiVolumeModel } from 'src/atlasComponents/sapi/type'
import { MultiDimMap } from 'src/util/fn'
import { ParcVolumeSpec } from "../store/util"
import {
  NehubaConfig,
  NgConfig,
  RecursivePartial,
  NgLayerSpec,
  NgPrecompMeshSpec,
  NgSegLayerSpec,
} from "./type"

// fsaverage uses threesurfer, which, whilst do not use ngId, uses 'left' and 'right' as keys 
const fsAverageKeyVal = {
  "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290": {
    "left hemisphere": "left",
    "right hemisphere": "right"
  }
}

/**
 * in order to maintain backwards compat with url encoding of selected regions
 * TODO setup a sentry to catch if these are ever used. if not, retire the hard coding 
 */
const BACKCOMAP_KEY_DICT = {

  // human multi level
  'juelich/iav/atlas/v1.0.0/1': {
    // icbm152
    'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2': {
      // julich brain v2.6
      'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26': {
        'left hemisphere': 'MNI152_V25_LEFT_NG_SPLIT_HEMISPHERE',
        'right hemisphere': 'MNI152_V25_RIGHT_NG_SPLIT_HEMISPHERE'
      },
      // bundle hcp
      // even though hcp, long/short bundle, and difumo has no hemisphere distinctions, the way siibra-python parses the region,
      // and thus attributes left/right hemisphere, still results in some regions being parsed as left/right hemisphere
      "juelich/iav/atlas/v1.0.0/79cbeaa4ee96d5d3dfe2876e9f74b3dc3d3ffb84304fb9b965b1776563a1069c": {
        "whole brain": "superficial-white-bundle-HCP",
        "left hemisphere": "superficial-white-bundle-HCP",
        "right hemisphere": "superficial-white-bundle-HCP"
      },
      // julich brain v1.18
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579": {
        "left hemisphere": "jubrain mni152 v18 left",
        "right hemisphere": "jubrain mni152 v18 right",
      },
      // long bundle
      "juelich/iav/atlas/v1.0.0/5": {
        "whole brain": "fibre bundle long",
        "left hemisphere": "fibre bundle long",
        "right hemisphere": "fibre bundle long",
      },
      // bundle short
      "juelich/iav/atlas/v1.0.0/6": {
        "whole brain": "fibre bundle short",
        "left hemisphere": "fibre bundle short",
        "right hemisphere": "fibre bundle short",
      },
      // difumo 64
      "minds/core/parcellationatlas/v1.0.0/d80fbab2-ce7f-4901-a3a2-3c8ef8a3b721": {
        "whole brain": "DiFuMo Atlas (64 dimensions)",
        "left hemisphere": "DiFuMo Atlas (64 dimensions)",
        "right hemisphere": "DiFuMo Atlas (64 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/73f41e04-b7ee-4301-a828-4b298ad05ab8": {
        "whole brain": "DiFuMo Atlas (128 dimensions)",
        "left hemisphere": "DiFuMo Atlas (128 dimensions)",
        "right hemisphere": "DiFuMo Atlas (128 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/141d510f-0342-4f94-ace7-c97d5f160235": {
        "whole brain": "DiFuMo Atlas (256 dimensions)",
        "left hemisphere": "DiFuMo Atlas (256 dimensions)",
        "right hemisphere": "DiFuMo Atlas (256 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/63b5794f-79a4-4464-8dc1-b32e170f3d16": {
        "whole brain": "DiFuMo Atlas (512 dimensions)",
        "left hemisphere": "DiFuMo Atlas (512 dimensions)",
        "right hemisphere": "DiFuMo Atlas (512 dimensions)",
      },
      "minds/core/parcellationatlas/v1.0.0/12fca5c5-b02c-46ce-ab9f-f12babf4c7e1": {
        "whole brain": "DiFuMo Atlas (1024 dimensions)",
        "left hemisphere": "DiFuMo Atlas (1024 dimensions)",
        "right hemisphere": "DiFuMo Atlas (1024 dimensions)",
      },
    },
    // colin 27
    "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": {
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26": {
        "left hemisphere": "COLIN_V25_LEFT_NG_SPLIT_HEMISPHERE",
        "right hemisphere": "COLIN_V25_RIGHT_NG_SPLIT_HEMISPHERE",
      },
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579": {
        "left hemisphere": "jubrain colin v18 left",
        "right hemisphere": "jubrain colin v18 right",
      }
    },
    // big brain
    "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588": {
      "minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26": {

      },
      // isocortex
      "juelich/iav/atlas/v1.0.0/4": {
        "whole brain": " tissue type: "
      },
      // cortical layers
      "juelich/iav/atlas/v1.0.0/3": {
        "whole brain": "cortical layers"
      },
    },

    // fsaverage
    "minds/core/referencespace/v1.0.0/tmp-fsaverage": fsAverageKeyVal,
  },
  // allen mouse
  'juelich/iav/atlas/v1.0.0/2': {
    // ccf v3
    "minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9": {
      // ccf v3 2017
      "minds/core/parcellationatlas/v1.0.0/05655b58-3b6f-49db-b285-64b5a0276f83": {
        "whole brain": "v3_2017",
        "left hemisphere": "v3_2017",
        "right hemisphere": "v3_2017"
      },
      // ccf v3 2015,
      "minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f": {
        "whole brain": "atlas",
        "left hemisphere": "atlas",
        "right hemisphere": "atlas"
      }
    }
  },
  // waxholm
  "minds/core/parcellationatlas/v1.0.0/522b368e-49a3-49fa-88d3-0870a307974a": {
    "minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8": {
      // v1.01
      "minds/core/parcellationatlas/v1.0.0/11017b35-7056-4593-baad-3934d211daba": {
        "whole brain": "v1_01",
        "left hemisphere": "v1_01",
        "right hemisphere": "v1_01"
      },
      // v2
      "minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d": {
        "whole brain": "v2",
        "left hemisphere": "v2",
        "right hemisphere": "v2"
      },
      // v3
      "minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe": {
        "whole brain": "v3",
        "left hemisphere": "v3",
        "right hemisphere": "v3"
      }
    }
  }
}


export function getTmplNgLayer(atlas: SapiAtlasModel, tmpl: SapiSpaceModel, spaceVolumes: SapiVolumeModel[]): Record<string, NgLayerSpec>{
  if (!atlas || !tmpl) return {}
  const ngId = `_${MultiDimMap.GetKey(atlas["@id"], tmpl["@id"], "tmplImage")}`
  const tmplImage = spaceVolumes.find(v => "neuroglancer/precomputed" in v.data.detail)
  if (!tmplImage) return {}
  return {
    [ngId]: {
      source: `precomputed://${tmplImage.data.url.replace(/^precomputed:\/\//, '')}`,
      ...tmplImage.data.detail["neuroglancer/precomputed"] as NgLayerSpec
    }
  }
}

export function getTmplAuxNgLayer(atlas: SapiAtlasModel, tmpl: SapiSpaceModel, spaceVolumes: SapiVolumeModel[]): Record<string, NgPrecompMeshSpec>{
  if (!atlas || !tmpl) return {}
  const ngId = `_${MultiDimMap.GetKey(atlas["@id"], tmpl["@id"], "auxLayer")}`
  const tmplImage = spaceVolumes.find(v => "neuroglancer/precompmesh" in v.data.detail)
  if (!tmplImage) return {}
  return {
    [ngId]: {
      source: `precompmesh://${tmplImage.data.url.replace(/^precompmesh:\/\//, '')}`,
      ...tmplImage.data.detail["neuroglancer/precompmesh"] as NgPrecompMeshSpec
    }
  }
}

export function getParcNgId(atlas: SapiAtlasModel, tmpl: SapiSpaceModel, parc: SapiParcellationModel, _laterality: string | SapiRegionModel) {
  let laterality: string
  if (typeof _laterality === "string") {
    laterality = _laterality
  } else {
    laterality = "whole brain"
    if (_laterality.name.indexOf("left") >= 0) laterality = "left hemisphere"
    if (_laterality.name.indexOf("right") >= 0) laterality = "right hemisphere"
  }
  let ngId = BACKCOMAP_KEY_DICT[atlas["@id"]]?.[tmpl["@id"]]?.[parc["@id"]]?.[laterality]
  if (!ngId) {
    ngId = `_${MultiDimMap.GetKey(atlas["@id"], tmpl["@id"], parc["@id"], laterality)}`
  }
  return ngId
}

export function getParcNgLayers(atlas: SapiAtlasModel, tmpl: SapiSpaceModel, parc: SapiParcellationModel, parcVolumes: { volume: SapiVolumeModel, volumeMetadata: ParcVolumeSpec }[]){
  const returnVal: Record<string, NgSegLayerSpec> = {}
  for (const parcVol of parcVolumes) {
    const { volume, volumeMetadata } = parcVol
    const { laterality, labelIndicies } = volumeMetadata
    const ngId = getParcNgId(atlas, tmpl, parc, laterality)

    returnVal[ngId] = {
      source: `precomputed://${volume.data.url.replace(/^precomputed:\/\//, '')}`,
      labelIndicies,
      laterality,
      transform: (volume.data.detail["neuroglancer/precomputed"] as any).transform
    }
  }
  return returnVal
}

type CongregatedVolume = {
  tmplVolumes: SapiVolumeModel[]
  tmplAuxMeshVolumes: SapiVolumeModel[]
  parcVolumes: { volume: SapiVolumeModel, volumeMetadata: ParcVolumeSpec}[]
}

export const getNgLayersFromVolumesATP = (volumes: CongregatedVolume, ATP: { atlas: SapiAtlasModel, template: SapiSpaceModel, parcellation: SapiParcellationModel }) => {
  
  const { tmplVolumes, tmplAuxMeshVolumes, parcVolumes } = volumes
  const { atlas, template, parcellation } = ATP
  return {
    tmplNgLayers: getTmplNgLayer(atlas, template, tmplVolumes),
    tmplAuxNgLayers: getTmplAuxNgLayer(atlas, template, tmplAuxMeshVolumes),
    parcNgLayers: getParcNgLayers(atlas, template, parcellation, parcVolumes)
  }
}

export function getRegionLabelIndex(atlas: SapiAtlasModel, tmpl: SapiSpaceModel, parc: SapiParcellationModel, region: SapiRegionModel) {
  const lblIdx = Number(region?.hasAnnotation?.internalIdentifier)
  if (isNaN(lblIdx)) return null
  return lblIdx
}

export const defaultNehubaConfig: NehubaConfig = {
  "configName": "",
  "globals": {
    "hideNullImageValues": true,
    "useNehubaLayout": {
      "keepDefaultLayouts": false
    },
    "useNehubaMeshLayer": true,
    "rightClickWithCtrlGlobal": false,
    "zoomWithoutCtrlGlobal": false,
    "useCustomSegmentColors": true
  },
  "zoomWithoutCtrl": true,
  "hideNeuroglancerUI": true,
  "rightClickWithCtrl": true,
  "rotateAtViewCentre": true,
  "enableMeshLoadingControl": true,
  "zoomAtViewCentre": true,
  "restrictUserNavigation": true,
  "disableSegmentSelection": false,
  "dataset": {
    "imageBackground": [
      1,
      1,
      1,
      1
    ],
    "initialNgState": {
      "showDefaultAnnotations": false,
      "layers": {},
    }
  },
  "layout": {
    "views": "hbp-neuro",
    "planarSlicesBackground": [
      1,
      1,
      1,
      1
    ],
    "useNehubaPerspective": {
      "enableShiftDrag": false,
      "doNotRestrictUserNavigation": false,
      "perspectiveSlicesBackground": [
        1,
        1,
        1,
        1
      ],
      "perspectiveBackground": [
        1,
        1,
        1,
        1
      ],
      "mesh": {
        "backFaceColor": [
          1,
          1,
          1,
          1
        ],
        "removeBasedOnNavigation": true,
        "flipRemovedOctant": true
      },
      "hideImages": false,
      "waitForMesh": false,
    }
  }
}

export const spaceMiscInfoMap = new Map([
  ['minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588', {
    name: 'bigbrain',
    scale: 1,
  }],
  ['minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2', {
    name: 'icbm2009c',
    scale: 1,
  }],
  ['minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992', {
    name: 'colin27',
    scale: 1,
  }],
  ['minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9', {
    name: 'allen-mouse',
    scale: 0.1,
  }],
  ['minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8', {
    name: 'waxholm',
    scale: 0.1,
  }],
])

export function getNehubaConfig(space: SapiSpaceModel): NehubaConfig {

  const darkTheme = space["@id"] !== "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588"
  const { scale } = spaceMiscInfoMap.get(space["@id"]) || { scale: 1 }
  const backgrd = darkTheme
    ? [0,0,0,1]
    : [1,1,1,1]

  const rmPsp = darkTheme
    ? {"mode":"<","color":[0.1,0.1,0.1,1]}
    :{"color":[1,1,1,1],"mode":"=="}
  const drawSubstrates = darkTheme
    ? {"color":[0.5,0.5,1,0.2]}
    : {"color":[0,0,0.5,0.15]}
  const drawZoomLevels = darkTheme
    ? {"cutOff":150000 * scale }
    : {"cutOff":200000 * scale,"color":[0.5,0,0,0.15] }

  // enable surface parcellation
  // otherwise, on segmentation selection, the unselected meshes will also be invisible
  const surfaceParcellation = space["@id"] === 'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992'
  return {
    "configName": "",
    "globals": {
      "hideNullImageValues": true,
      "useNehubaLayout": {
        "keepDefaultLayouts": false
      },
      "useNehubaMeshLayer": true,
      "rightClickWithCtrlGlobal": false,
      "zoomWithoutCtrlGlobal": false,
      "useCustomSegmentColors": true
    },
    "zoomWithoutCtrl": true,
    "hideNeuroglancerUI": true,
    "rightClickWithCtrl": true,
    "rotateAtViewCentre": true,
    "enableMeshLoadingControl": true,
    "zoomAtViewCentre": true,
    // "restrictUserNavigation": true,
    "dataset": {
      "imageBackground": backgrd,
      "initialNgState": {
        "showDefaultAnnotations": false,
        "layers": {},
        "navigation": {
          "zoomFactor": 350000 * scale,
        },
        "perspectiveOrientation": [
          0.3140767216682434,
          -0.7418519854545593,
          0.4988985061645508,
          -0.3195493221282959
        ],
        "perspectiveZoom": 1922235.5293810747 * scale
      }
    },
    "layout": {
      "useNehubaPerspective": {
        "perspectiveSlicesBackground": backgrd,
        "removePerspectiveSlicesBackground": rmPsp,
        "perspectiveBackground": backgrd,
        "fixedZoomPerspectiveSlices": {
          "sliceViewportWidth": 300,
          "sliceViewportHeight": 300,
          "sliceZoom": 563818.3562426177 * scale,
          "sliceViewportSizeMultiplier": 2
        },
        "mesh": {
          "backFaceColor": backgrd,
          "removeBasedOnNavigation": true,
          "flipRemovedOctant": true,
          surfaceParcellation
        },
        "centerToOrigin": true,
        "drawSubstrates": drawSubstrates,
        "drawZoomLevels": drawZoomLevels,
        "restrictZoomLevel": {
          "minZoom": 1200000 * scale,
          "maxZoom": 3500000 * scale
        }
      }
    }
  }
}


export function cvtNavigationObjToNehubaConfig(navigationObj, nehubaConfigObj: RecursivePartial<NgConfig>): RecursivePartial<NgConfig>{
  const {
    orientation = [0, 0, 0, 1],
    perspectiveOrientation = [0, 0, 0, 1],
    perspectiveZoom = 1e6,
    zoom = 1e6,
    position = [0, 0, 0],
    positionReal = true,
  } = navigationObj || {}

  const voxelSize = (() => {
    const {
      navigation = {}
    } = nehubaConfigObj || {}
    const { pose = {} } = navigation
    const { position = {} } = pose
    const { voxelSize = [1, 1, 1] } = position
    return voxelSize
  })()

  return {
    perspectiveOrientation,
    perspectiveZoom,
    navigation: {
      pose: {
        position: {
          voxelCoordinates: positionReal
            ? [0, 1, 2].map(idx => position[idx] / voxelSize[idx])
            : position,
          voxelSize
        },
        orientation,
      },
      zoomFactor: zoom
    }
  }
}
