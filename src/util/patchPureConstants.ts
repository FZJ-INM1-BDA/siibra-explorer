/**
 * README: the purpose of this file is to monkey patch discrepency between siibra-api 
 * backend and original backend.
 * 
 * In principle, these should be built into siibra-python, and this file should become obsolete.
 */

import { IHasId } from "./interfaces";
import { TRegionSummary } from "./siibraApiConstants/types";

type TAppend = {
  parent: IHasId | { name: string }
  '@type': 'julich/siibra/append-region/v0.0.1'
}

type TPatch = {
  target: IHasId | { name: string }
  '@type': 'julich/siibra/patch-region/v0.0.1'
}

type TPatchRegion = {
  '@id': string
  targetSpace: IHasId[] | '*'
  targetParcellation: IHasId[] | '*'
  payload: Partial<TRegionSummary>
} & (TAppend | TPatch)

const encoder = new TextEncoder()
async function getShaDigest(input: string){
  const digest = await crypto.subtle.digest('SHA-1', encoder.encode(input))
  const array = Array.from(new Uint8Array(digest))
  const hex = array.map(v => v.toString(16)).join('')
  return hex
}
async function getInterpolatedPatchObj(targetName: string, labelIndex: number){
  const returnObj: TPatchRegion = {
    '@id': '',
    "@type": 'julich/siibra/patch-region/v0.0.1',
    "target": {
      "name": targetName
    },
    "targetParcellation": [{
      "@id": 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290'
    }],
    "targetSpace": [{
      '@id': 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588'
    }],
    "payload": {
      _dataset_specs: [{
        "@type": "fzj/tmp/volume_type/v0.0.1" as const,
        "@id": "fzj/tmp/volume_type/v0.0.1/interpolated",
        "name": "Julich Brain v2.5 interpolated map",
        "volume_type": "neuroglancer/precomputed" as const,
        "url": "https://neuroglancer.humanbrainproject.org/precomputed/BigBrainRelease.2015/2019_05_22_interpolated_areas",
        "detail": {
          "neuroglancer/precomputed": {
            "labelIndex": labelIndex,
            "transform": [[1,0,0,-70677184],[0,1,0,-51990000],[0,0,1,-58788284],[0,0,0,1]]
          }
        },
        "space_id": "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588",
        map_type: 'labelled'
      }],
    }
  }
  const hex = await getShaDigest(JSON.stringify(returnObj))
  return {
    ...returnObj,
    '@id': hex
  }
}

async function getIndividualMap(parentName: string, regionName: string, url: string, transform: number[][], labelIndex: number){
  const volumeId = await getShaDigest(url)
  const returnObj: TPatchRegion = {
    '@id': '',
    "@type": 'julich/siibra/patch-region/v0.0.1',
    "target": {
      "name": regionName
    },
    "targetParcellation": [{
      "@id": 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290'
    }],
    "targetSpace": [{
      '@id': 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588'
    }],
    "payload": {
      '_dataset_specs': [{
        "@type": "fzj/tmp/volume_type/v0.0.1" as const,
        "@id": `fzj/tmp/volume_type/v0.0.1/${volumeId}`,
        "name": "Julich Brain v2.5 detailed map",
        "volume_type": "neuroglancer/precomputed" as const,
        "url": url,
        "detail": {
          "neuroglancer/precomputed": {
            "labelIndex": labelIndex,
            "transform": transform
          }
        },
        space_id: 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588',
        map_type: 'labelled'
      }],
    }
  }
  const hex = await getShaDigest(JSON.stringify(returnObj))
  return {
    ...returnObj,
    '@id': hex
  }
}

const bigBrainRegions: Promise<TPatchRegion>[] = [
  getInterpolatedPatchObj('Area IFJ1 (IFS,PreCS)', 9),
  getInterpolatedPatchObj('Area IFJ2 (IFS,PreCS)', 10),
  getInterpolatedPatchObj('Area IFS1 (IFS)', 11),
  getInterpolatedPatchObj('Area IFS2 (IFS)', 12),
  getInterpolatedPatchObj('Area IFS3 (IFS)', 13),
  getInterpolatedPatchObj('Area IFS4 (IFS)', 14),

  getIndividualMap(
    'lateral geniculate body',
    'LGB-lam1 (CGL, Metathalamus)',
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2020_11_11_LGB-lam/LGB-lam1/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
  getIndividualMap(
    'lateral geniculate body',
    'LGB-lam2 (CGL, Metathalamus)',
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2020_11_11_LGB-lam/LGB-lam2/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
  getIndividualMap(
    'lateral geniculate body',
    'LGB-lam3 (CGL, Metathalamus)',
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2020_11_11_LGB-lam/LGB-lam3/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
  getIndividualMap(
    'lateral geniculate body',
    'LGB-lam4 (CGL, Metathalamus)',
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2020_11_11_LGB-lam/LGB-lam4/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
  getIndividualMap(
    'lateral geniculate body',
    'LGB-lam5 (CGL, Metathalamus)',
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2020_11_11_LGB-lam/LGB-lam5/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
  getIndividualMap(
    'lateral geniculate body',
    'LGB-lam6 (CGL, Metathalamus)',
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2020_11_11_LGB-lam/LGB-lam6/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),

  getIndividualMap(
    'medial geniculate body',
    "MGB-MGBd (CGM, Metathalamus)",
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2021_04_27_mgb/2021_04_27_MGBd/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
  getIndividualMap(
    'medial geniculate body',
    "MGB-MGBm (CGM, Metathalamus)",
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2021_04_27_mgb/2021_04_27_MGBm/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
  getIndividualMap(
    'medial geniculate body',
    "MGB-MGBv (CGM, Metathalamus)",
    "https://neuroglancer.humanbrainproject.eu/precomputed/BigBrainRelease.2015/2021_04_27_mgb/2021_04_27_MGBv/",
    [[1,0,0,-70677184.0],[0,1,0,-7290000.0],[0,0,1,-58788284.0],[0,0,0,1]],
    1  
  ),
]

export const patchRegions = [
  ...bigBrainRegions
]
