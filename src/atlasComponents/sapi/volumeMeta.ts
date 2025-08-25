type X4Affine = number[][]


/**
 * Preferred colormap in order of preference
 */
type PreferredColormap = string[]
type X1Vector = [number, number, number]
type X1Vector1 = [number, number, number, number]
/**
 * Best locations to view this volume.
 */
export type BestViewPoint = (
  | PointGeometry
  | PlaneGeometry
  | EnclosedGeometry
)

export interface MetaV1Schema {
  version: 1
  data?: GenericImage | SingleChannelImage | ThreeChannelImage
  transform?: X4Affine
  preferredColormap?: PreferredColormap
  "https://schema.brainatlas.eu/github/humanbrainproject/neuroglancer"?: NeuroglancerSpecificConfigurations
  "https://schema.brainatlas.eu/github/humanbrainproject/nehuba"?: NehubaSpeicficConfigurations
  "https://schema.brainatlas.eu/github/fzj-inm1-bda/siibra-explorer"?: SiibraExplorerSpecificConfigurationOptions
  bestViewPoints?: BestViewPoint[]
}
/**
 * Generic image, with arbitary dimensions.
 */
interface GenericImage {
  type: "image"
  range?: ValueRange[]
}
/**
 * Describes the range of values
 */
interface ValueRange {
  min?: number
  max?: number
  [k: string]: unknown
}
/**
 * Describes an image with 1 dimension, e.g. used as greyscale image.
 */
interface SingleChannelImage {
  type: "image/1d"
  range?: [ValueRange]
  [k: string]: unknown
}
/**
 * Describes an image with 3 dimensions, mostly used as RGB image.
 */
interface ThreeChannelImage {
  type: "image/3d"
  range?: [ValueRange, ValueRange, ValueRange]
  [k: string]: unknown
}
/**
 * configurations specific to hbp fork of neuroglancer
 */
interface NeuroglancerSpecificConfigurations {
  /**
   * Hints that client should use this shader for the volume in neuroglancer
   */
  shader?: string
  opacity?: number
  [k: string]: unknown
}
/**
 * configuration specific to nehuba (layer on top of hbp fork of neuroglancer)
 */
interface NehubaSpeicficConfigurations {
  config?: Configuration
  [k: string]: unknown
}
/**
 * configuration to be used by this volume
 */
interface Configuration {
  globals?: {
    useNehubaLayout?: boolean
    useNehubaMeshLayer?: boolean
    [k: string]: unknown
  }
  zoomWithoutCtrl?: boolean
  rightClickWithCtrl?: boolean
  rotateAtViewCentre?: boolean
  zoomAtViewCentre?: boolean
  restrictUserNavigation?: boolean
  disableSegmentSelection?: boolean
  disableSegmentHighlighting?: boolean
  enableMeshLoadingControl?: boolean
  hideNeuroglancerUI?: boolean
  crossSectionBackground?: X1Vector1
  perspectiveViewBackground?: X1Vector1
  dataset?: {
    imageBackground?: X1Vector1
    initialNgState?: {
      [k: string]: unknown
    }
    [k: string]: unknown
  }
  layout?: {
    views?:
      | "hbp-neuro"
      | {
          slice1: X1Vector1
          slice2: X1Vector1
          slice3: X1Vector1
          [k: string]: unknown
        }
    hideSliceViewsCheckbox?: boolean
    useNehubaPerspective?: {
      enablePerspectiveDrag?: boolean
      doNotRestrictUserNavigation?: boolean
      perspectiveSlicesBackground?: X1Vector1
      removePerspectiveSlicesBackground?: {
        color?: X1Vector1
        mode?: "none" | ">" | ">=" | "==" | "<=" | "<"
        [k: string]: unknown
      }
      fixedZoomPerspectiveSlices?: {
        sliceViewportWidth: number
        sliceViewportHeight: number
        sliceZoom: number
        sliceViewportSizeMultiplier: 1 | 2 | 3
        [k: string]: unknown
      }
      mesh?: {
        removeOctant?: X1Vector1
        backFaceColor?: X1Vector1
        removeBasedOnNavigation?: boolean
        flipRemovedOctant?: boolean
        surfaceParcellation?: boolean
        [k: string]: unknown
      }
      centerToOrigin?: boolean
      drawSubstrates?: {
        color?: X1Vector1
        translate?: X1Vector
        [k: string]: unknown
      }
      drawZoomLevels?: {
        cutOff?: number
        color?: X1Vector1
        [k: string]: unknown
      }
      hideAllSlices?: boolean
      hideSlices?: ("slice1" | "slice2" | "slice3")[]
      waitForMesh?: boolean
      restrictZoomLevel?: {
        minZoom?: number
        maxZoom?: number
        [k: string]: unknown
      }
      disableAxisLinesInPerspective?: boolean
      [k: string]: unknown
    }
    [k: string]: unknown
  }
  [k: string]: unknown
}
interface SiibraExplorerSpecificConfigurationOptions {
  useTheme?: "light" | "dark"
  [k: string]: unknown
}
interface PointGeometry {
  type: "point"
  value?: X1Vector
  [k: string]: unknown
}
interface PlaneGeometry {
  type: "plane"
  [k: string]: unknown
}
export interface EnclosedGeometry {
  type?: "enclosed"
  points?: PointGeometry[]
  [k: string]: unknown
}
