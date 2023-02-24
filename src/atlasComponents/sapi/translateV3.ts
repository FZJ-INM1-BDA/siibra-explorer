import {
  SxplrAtlas, SxplrParcellation, SxplrTemplate, SxplrRegion, NgLayerSpec, NgPrecompMeshSpec, NgSegLayerSpec, VoiFeature, Point, TemplateDefaultImage, TThreeSurferMesh, TThreeMesh, LabelledMap, CorticalFeature
} from "./sxplrTypes"
import { PathReturn } from "./typeV3"
import { hexToRgb } from 'common/util'
import { components } from "./schemaV3"


class TranslateV3 {
  
  #atlasMap: Map<string, PathReturn<"/atlases/{atlas_id}">> = new Map()
  retrieveAtlas(atlas: SxplrAtlas): PathReturn<"/atlases/{atlas_id}"> {
    return this.#atlasMap.get(atlas.id)
  }
  async translateAtlas(atlas:PathReturn<"/atlases/{atlas_id}">): Promise<SxplrAtlas> {
    this.#atlasMap.set(atlas["@id"], atlas)
    return {
      id: atlas["@id"],
      type: "SxplrAtlas",
      name: atlas.name
    }
  }

  #parcellationMap: Map<string, PathReturn<"/parcellations/{parcellation_id}">> = new Map()
  retrieveParcellation(parcellation: SxplrParcellation): PathReturn<"/parcellations/{parcellation_id}"> {
    return this.#parcellationMap.get(parcellation.id)
  }
  async translateParcellation(parcellation:PathReturn<"/parcellations/{parcellation_id}">): Promise<SxplrParcellation> {
    return {
      id: parcellation["@id"],
      name: parcellation.name,
      modality: parcellation.modality,
      type: "SxplrParcellation"
    }
  }

  #templateMap: Map<string, PathReturn<"/spaces/{space_id}">> = new Map()
  retrieveTemplate(template:SxplrTemplate): PathReturn<"/spaces/{space_id}"> {
    return this.#templateMap.get(template.id)
  }
  async translateTemplate(template:PathReturn<"/spaces/{space_id}">): Promise<SxplrTemplate> {
    this.#templateMap.set(template["@id"], template)
    return {
      id: template["@id"],
      name: template.fullName,
      type: "SxplrTemplate"
    }
  }

  /**
   * map of both name and id to region
   */
  #regionMap: Map<string, PathReturn<"/regions/{region_id}">> = new Map()
  retrieveRegion(region: SxplrRegion): PathReturn<"/regions/{region_id}"> {
    return this.#regionMap.get(region.name)
  }
  async translateRegion(region: PathReturn<"/regions/{region_id}">): Promise<SxplrRegion> {
    const { ['@id']: regionId } = region
    this.#regionMap.set(regionId, region)
    this.#regionMap.set(region.name, region)
    return {
      id: region["@id"],
      name: region.name,
      color: hexToRgb(region.hasAnnotation?.displayColor) as [number, number, number],
      parentIds: region.hasParent.map( v => v["@id"] ),
      type: "SxplrRegion",
      centroid: region.hasAnnotation?.bestViewPoint
        ? await (async () => {
          const bestViewPoint = region.hasAnnotation?.bestViewPoint
          const fullSpace = this.#templateMap.get(bestViewPoint.coordinateSpace['@id'])
          const space = await this.translateTemplate(fullSpace)
          return {
            loc: bestViewPoint.coordinates.map(v => v.value) as [number, number, number],
            space
          }
        })()
        : null
    }
  }

  async translateSpaceToVolumeImage(template: SxplrTemplate): Promise<NgLayerSpec[]> {
    if (!template) return []
    const space = this.retrieveTemplate(template)
    if (!space) return []
    const returnObj: NgLayerSpec[] = []
    const validImages = space.defaultImage.filter(di => di.formats.includes("neuroglancer/precomputed"))

    for (const defaultImage of validImages) {
      
      const { providedVolumes } = defaultImage
  
      const { ['neuroglancer/precomputed']: precomputedVol } = providedVolumes
      if (!precomputedVol) {
        console.error(`neuroglancer/precomputed data source has not been found!`)
        continue
      }
      if (typeof precomputedVol === "object") {
        console.error(`template default image cannot have fragment`)
        continue
      }
      const [transform, info] = await Promise.all([
        (async () => {
          
          const resp = await fetch(`${precomputedVol}/transform.json`)
          if (resp.status >= 400) {
            console.error(`cannot retrieve transform: ${resp.status}`)
            return null
          }
          const transform: number[][] = await resp.json()
          return transform
        })(),
        (async () => {
          const resp = await fetch(`${precomputedVol}/info`)
          if (resp.status >= 400) {
            console.error(`cannot retrieve transform: ${resp.status}`)
            return null
          }
          const info = await resp.json()
          const { resolution, size } = info.scales[0]
          return {
            voxel: info.scales[0].size as [number, number, number],
            real: [0, 1, 2].map(idx => resolution[idx] * size[idx]) as [number, number, number],
          }
        })()
      ])
      returnObj.push({
        source: `precomputed://${precomputedVol}`,
        transform,
        info,
      })
    }
    return returnObj
  }

  async translateSpaceToSurfaceImage(template: SxplrTemplate): Promise<TThreeMesh[]> {
    if (!template) return []
    const space = this.retrieveTemplate(template)
    if (!space) return []
    const returnObj: TThreeMesh[] = []
    const validImages = space.defaultImage.filter(di => di.formats.includes("gii-mesh"))
    for (const defaultImage of validImages) {
      const { providedVolumes, variant } = defaultImage
      if (!variant) {
        console.warn(`variant is not defined!`)
        continue
      }

      const { ['gii-mesh']: giiMesh } = providedVolumes
      if (!giiMesh) {
        console.warn(`default image does not have gii-mesh in provided volumes`)
        continue
      }

      if (typeof giiMesh === "string") {
        console.warn(`three giiMesh is of type string, must be a dict!`)
        continue
      }

      for (const lateriality in giiMesh) {
        const url = giiMesh[lateriality]
        
        returnObj.push({
          id: `${template.name}-${variant}-${lateriality}`,
          space: template.name,
          variant,
          laterality: /left/.test(lateriality)
            ? 'left'
            : /right/.test(lateriality)
              ? 'right'
              : null,
          url,
        })
      }
    }
    return returnObj
  }

  async translateLabelledMapToThreeLabel(map:PathReturn<"/map">) {
    const threeLabelMap: Record<string, { laterality: 'left' | 'right', url: string, region: LabelledMap[] }> = {}
    const registerLayer = (url: string, laterality: 'left' | 'right', region: string, label: number) => {
      if (!threeLabelMap[url]) {
        threeLabelMap[url] = {
          laterality,
          region: [],
          url,
        }
      }

      threeLabelMap[url].region.push({
        name: region,
        label,
      })
    }
    for (const regionname in map.indices) {
      for (const { volume: volIdx, fragment, label } of map.indices[regionname]) {
        const volume = map.volumes[volIdx || 0]
        if (!volume.formats.includes("gii-label")) {
          console.warn(`getting three label error! volume does not provide gii-label! skipping!`)
          continue
        }
        const { ["gii-label"]: giiLabel } = volume.providedVolumes

        
        if (!fragment || !["left hemisphere", "right hemisphere"].includes(fragment)) {
          console.warn(`either fragment not defined, or fragment is not '{left|right} hemisphere'. Skipping!`)
          continue
        }
        if (!giiLabel[fragment]) {
          console.warn(`fragment '${fragment}' not provided by volume.gii-label! skipping!`)
          continue
        }
        let laterality: 'left' | 'right'
        if (fragment.includes("left")) laterality = "left"
        if (fragment.includes("right")) laterality = "right"
        if (!laterality) {
          console.warn(`cannot determine the laterality! skipping`)
          continue
        }
        registerLayer(giiLabel[fragment], laterality, regionname, label)
      }
    }
    return threeLabelMap
  }
  
  async translateLabelledMapToNgSegLayers(map:PathReturn<"/map">): Promise<Record<string,{layer:NgSegLayerSpec, region: LabelledMap[]}>> {
    const nglayerSpecMap: Record<string,{layer:NgSegLayerSpec, region: LabelledMap[]}> = {}

    const registerLayer = async (url: string, label: number, region: LabelledMap) => {
      let segLayerSpec: {layer:NgSegLayerSpec, region: LabelledMap[]}
      if (url in nglayerSpecMap){
        segLayerSpec = nglayerSpecMap[url]
      } else {
        const resp = await fetch(`${url}/transform.json`)
        const transform = await resp.json()
        segLayerSpec = {
          layer: {
            labelIndicies: [],
            source: `precomputed://${url}`,
            transform,
          },
          region: []
        }
        nglayerSpecMap[url] = segLayerSpec
      }
      segLayerSpec.layer.labelIndicies.push(label)
      segLayerSpec.region.push(region)
    }
    for (const regionname in map.indices) {
      for (const index of map.indices[regionname]) {
        const { volume:volumeIdx=0, fragment, label } = index
        if (!label) {
          console.error(`Attempmting to add labelledmap with label '${label}'`)
        }
        const error = `Attempting to access map volume with idx '${volumeIdx}'`
        if (!map.volumes[volumeIdx]) {
          console.error(`${error}, IndexError, Skipping`)
          continue
        }
        const volume = map.volumes[volumeIdx]
        
        if (!volume.providedVolumes["neuroglancer/precomputed"]) {
          console.error(`${error}, volume does not provide neuroglancer/precomputed. Skipping.`)
          continue
        }

        const precomputedVol = volume.providedVolumes["neuroglancer/precomputed"]
        if (typeof precomputedVol === "string") {
          await registerLayer(precomputedVol, label, { name: regionname, label })
          continue
        }

        if (!precomputedVol[fragment]) {
          console.error(`${error}, fragment provided is '${fragment}', but was not available in volume: ${Object.keys(precomputedVol)}`)
          continue
        }
        await registerLayer(precomputedVol[fragment], label, { name: regionname, label })
      }
    }
    
    return nglayerSpecMap
  }

  async translateSpaceToAuxMesh(template: SxplrTemplate): Promise<NgPrecompMeshSpec[]>{
    if (!template) return []
    const space = this.retrieveTemplate(template)
    if (!space) return []
    const returnObj: NgPrecompMeshSpec[] = []
    const validImages = space.defaultImage.filter(di => di.formats.includes("neuroglancer/precompmesh/surface"))

    for (const defaultImage of validImages) {
      
      const { providedVolumes } = defaultImage
  
      const { ['neuroglancer/precompmesh/surface']: precompMeshVol } = providedVolumes
      if (!precompMeshVol) {
        console.error(`neuroglancer/precompmesh/surface data source has not been found!`)
        continue
      }
      if (typeof precompMeshVol === "object") {
        console.error(`template default image cannot have fragment`)
        continue
      }

      const splitPrecompMeshVol = precompMeshVol.split(" ")
      if (splitPrecompMeshVol.length !== 2) {
        console.error(`Expecting exactly two fragments by splitting precompmeshvol, but got ${splitPrecompMeshVol.length}`)
        continue
      }
      const resp = await fetch(`${splitPrecompMeshVol[0]}/transform.json`)
      if (resp.status >= 400) {
        console.error(`cannot retrieve transform: ${resp.status}`)
        continue
      }
      const transform: number[][] = await resp.json()
      returnObj.push({
        source: `precompmesh://${splitPrecompMeshVol[0]}`,
        transform,
        auxMeshes: [{
          labelIndicies: [Number(splitPrecompMeshVol[1])],
          name: "auxmesh"
        }]
      })
    }
    return returnObj
  }

  async translatePoint(point: components["schemas"]["CoordinatePointModel"]): Promise<Point> {
    const sapiSpace = this.#templateMap.get(point.coordinateSpace['@id'])
    const space = await this.translateTemplate(sapiSpace)
    return {
      space,
      loc: point.coordinates.map(v => v.value) as [number, number, number]
    }
  }

  async translateVoi(voi: PathReturn<"/feature/Image/{feature_id}">): Promise<VoiFeature> {
    const { boundingbox } = voi
    const { loc: center, space } = await this.translatePoint(boundingbox.center)
    const { loc: maxpoint } = await this.translatePoint(boundingbox.maxpoint)
    const { loc: minpoint } = await this.translatePoint(boundingbox.minpoint)
    return {
      bbox: {
        center,
        maxpoint,
        minpoint,
        space
      },
      name: voi.name,
      desc: voi.description,
      id: voi.id
    }
  }

  
  async translateCorticalProfile(feat: PathReturn<"/feature/CorticalProfile/{feature_id}">): Promise<CorticalFeature<number>> {
    return {
      id: feat.id,
      name: feat.name,
      desc: feat.description,
      link: [
        ...feat.datasets
          .map(ds => ds.urls)
          .flatMap(v => v)
          .map(url => ({
            href: url.url,
            text: url.url
          })),
        ...feat.datasets
          .map(ds => ({
            href: ds.ebrains_page,
            text: "ebrains resource"
          }))
      ]
    }
  }
}

export const translateV3Entities = new TranslateV3()
