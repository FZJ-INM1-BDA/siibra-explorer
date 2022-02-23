
export type RecursivePartial<T> = {
  [K in keyof T]?: RecursivePartial<T[K]>
}

type Vec4 = number[]
type Vec3 = number[]

export type NgConfigViewerState = {
  perspectiveOrientation: Vec4
  perspectiveZoom: number
  navigation: {
    pose: {
      position: {
        voxelSize: Vec3
        voxelCoordinates: Vec3
      }
      orientation: Vec4
    }
    zoomFactor: number
  }
}

export type NgConfig = {
  showDefaultAnnotations: boolean
  layers: Record<string, NgLayerSpec>
  gpuMemoryLimit: number,
} & NgConfigViewerState

interface _NehubaConfig {
  configName: string
  globals: {
    hideNullImageValues: boolean
    useNehubaLayout: {
      keepDefaultLayouts: boolean
    }
    useNehubaMeshLayer: boolean
    rightClickWithCtrlGlobal: boolean
    zoomWithoutCtrlGlobal: boolean
    useCustomSegmentColors: boolean
  }
  zoomWithoutCtrl: boolean
  hideNeuroglancerUI: boolean
  rightClickWithCtrl: boolean
  rotateAtViewCentre: boolean
  enableMeshLoadingControl: boolean
  zoomAtViewCentre: boolean
  restrictUserNavigation: boolean
  disableSegmentSelection: boolean
  dataset: {
    imageBackground: Vec4
    initialNgState: NgConfig
  },
  layout: {
    views: string,
    planarSlicesBackground: Vec4
    useNehubaPerspective: {
      enableShiftDrag: boolean
      doNotRestrictUserNavigation: boolean
      removePerspectiveSlicesBackground: {
        mode: string
        color: Vec4
      }
      perspectiveSlicesBackground: Vec4
      perspectiveBackground: Vec4
      fixedZoomPerspectiveSlices: {
        sliceViewportWidth: number
        sliceViewportHeight: number
        sliceZoom: number
        sliceViewportSizeMultiplier: number
      }
      mesh: {
        backFaceColor: Vec4
        removeBasedOnNavigation: boolean
        flipRemovedOctant: boolean
        surfaceParcellation: boolean
      },
      centerToOrigin: boolean
      drawSubstrates: {
        color: Vec4
      }
      drawZoomLevels: {
        cutOff: number
        color: Vec4
      }
      restrictZoomLevel: {
        minZoom: number
        maxZoom: number
      }
      hideImages: boolean
      waitForMesh: boolean
    }
  }
}

export type NehubaConfig = RecursivePartial<_NehubaConfig>

export type NgLayerSpec = {
  source: string
  transform: number[][]
  opacity?: number
  visible?: boolean
}

export type NgPrecompMeshSpec = {
  auxMeshes: {
    name: string
    labelIndicies: number[]
  }[]
} & NgLayerSpec

export type NgSegLayerSpec = {
  labelIndicies: number[]
  laterality: 'left hemisphere' | 'right hemisphere' | 'whole brain'
} & NgLayerSpec
