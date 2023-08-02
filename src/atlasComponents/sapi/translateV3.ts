import {
  SxplrAtlas, SxplrParcellation, SxplrTemplate, SxplrRegion, NgLayerSpec, NgPrecompMeshSpec, NgSegLayerSpec, VoiFeature, Point, TThreeMesh, LabelledMap, CorticalFeature, Feature, TabularFeature, GenericInfo, BoundingBox
} from "./sxplrTypes"
import { PathReturn } from "./typeV3"
import { hexToRgb } from 'common/util'
import { components } from "./schemaV3"
import { defaultdict } from "src/util/fn"


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
      name: atlas.name,
      species: atlas.species
    }
  }

  async translateDs(ds: PathReturn<"/parcellations/{parcellation_id}">['datasets'][number]): Promise<GenericInfo> {
    return {
      name: ds.name,
      desc: ds.description,
      link: ds.urls.map(v => ({
        href: v.url,
        text: 'Link'
      }))
    }
  }

  #parcellationMap: Map<string, PathReturn<"/parcellations/{parcellation_id}">> = new Map()
  retrieveParcellation(parcellation: SxplrParcellation): PathReturn<"/parcellations/{parcellation_id}"> {
    return this.#parcellationMap.get(parcellation.id)
  }
  async translateParcellation(parcellation:PathReturn<"/parcellations/{parcellation_id}">): Promise<SxplrParcellation> {
    const ds = await Promise.all((parcellation.datasets || []).map(ds => this.translateDs(ds)))
    const { ...rest } = ds[0] || {}
    const { ['@id']: prevId } = parcellation.version?.prev || {}
    return {
      id: parcellation["@id"],
      name: parcellation.name,
      modality: parcellation.modality,
      type: "SxplrParcellation",
      prevId,
      shortName: parcellation.shortname,
      ...rest
    }
  }

  #templateMap: Map<string, PathReturn<"/spaces/{space_id}">> = new Map()
  #sxplrTmplMap: Map<string, SxplrTemplate> = new Map()
  retrieveTemplate(template:SxplrTemplate): PathReturn<"/spaces/{space_id}"> {
    return this.#templateMap.get(template.id)
  }
  async translateTemplate(template:PathReturn<"/spaces/{space_id}">): Promise<SxplrTemplate> {

    this.#templateMap.set(template["@id"], template)
    const tmpl = {
      id: template["@id"],
      name: template.fullName,
      shortName: template.shortName,
      type: "SxplrTemplate" as const
    }
    this.#sxplrTmplMap.set(tmpl.id, tmpl)
    return tmpl
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


  #hasNoFragment(input: Record<string, unknown>): input is Record<string, string> {
    for (const key in input) {
      if (typeof input[key] !== 'string') return false
    }
    return true
  }
  async #extractNgPrecompUnfrag(input: Record<string, unknown>) {
    if (!this.#hasNoFragment(input)) {
      throw new Error(`#extractNgPrecompUnfrag can only handle unfragmented volume`)
    }
    
    const returnObj: Record<string, {
      url: string
      transform: number[][]
      info: Record<string, any>
    }> = {}
    for (const key in input) {
      if (key !== 'neuroglancer/precomputed') {
        continue
      }
      const url = input[key]
      const [ transform, info ] = await Promise.all([
        this.cFetch(`${url}/transform.json`).then(res => res.json()) as Promise<number[][]>,
        this.cFetch(`${url}/info`).then(res => res.json()) as Promise<Record<string, any>>,
      ])
      returnObj[key] = {
        url: input[key],
        transform: transform,
        info: info,
      }
    }
    return returnObj
  }

  async translateSpaceToVolumeImage(template: SxplrTemplate): Promise<NgLayerSpec[]> {
    if (!template) return []
    const space = this.retrieveTemplate(template)
    if (!space) return []
    const returnObj: NgLayerSpec[] = []
    const validImages = space.defaultImage.filter(di => di.formats.includes("neuroglancer/precomputed"))

    for (const defaultImage of validImages) {
      
      const { providedVolumes } = defaultImage
      const { "neuroglancer/precomputed": precomputedVol } = await this.#extractNgPrecompUnfrag(providedVolumes)
      
      if (!precomputedVol) {
        console.error(`neuroglancer/precomputed data source has not been found!`)
        continue
      }
      const { transform, info: _info, url } = precomputedVol
      const { resolution, size } = _info.scales[0]
      const info = {
        voxel: size as [number, number, number],
        real: [0, 1, 2].map(idx => resolution[idx] * size[idx]) as [number, number, number],
        resolution: resolution as [number, number, number]
      }
      returnObj.push({
        source: `precomputed://${url}`,
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
          // Does not support gii-label... skipping!
          continue
        }
        const { ["gii-label"]: giiLabel } = volume.providedVolumes

        
        if (!fragment || !["left hemisphere", "right hemisphere"].includes(fragment)) {
          console.warn(`either fragment not defined, or fragment is not '{left|right} hemisphere'. Skipping!`)
          continue
        }
        if (!giiLabel[fragment]) {
          // Does not support gii-label... skipping!
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
  
  mapTPRToFrag = defaultdict(() => defaultdict(() => defaultdict(() => null as string)))

  #wkmpLblMapToNgSegLayers = new WeakMap()
  async translateLabelledMapToNgSegLayers(map:PathReturn<"/map">): Promise<Record<string,{layer:NgSegLayerSpec, region: LabelledMap[]}>> {
    if (this.#wkmpLblMapToNgSegLayers.has(map)) {
      return this.#wkmpLblMapToNgSegLayers.get(map)
    }
    const nglayerSpecMap: Record<string,{layer:NgSegLayerSpec, region: LabelledMap[]}> = {}

    const registerLayer = async (url: string, label: number, region: LabelledMap) => {
      let segLayerSpec: {layer:NgSegLayerSpec, region: LabelledMap[]}
      if (url in nglayerSpecMap){
        segLayerSpec = nglayerSpecMap[url]
      } else {
        const resp = await this.cFetch(`${url}/transform.json`)
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
          // volume does not provide neuroglancer/precomputed
          // probably when fsaverage has been selected
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
    this.#wkmpLblMapToNgSegLayers.set(map, nglayerSpecMap)
    return nglayerSpecMap
  }

  #cFetchCache = new Map<string, string>()
  /**
   * Cached fetch
   * 
   * Since translate v3 has no dependency on any angular components.
   * We couldn't cache the response. This is a monkey patch to allow for caching of queries.
   * @param url: string
   * @returns { status: number, json: () => Promise<unknown> }
   */
  async cFetch(url: string): Promise<{ status: number, json?: () => Promise<any> }> {
    
    if (!this.#cFetchCache.has(url)) {
      const resp = await fetch(url)
      if (resp.status >= 400) {
        return {
          status: resp.status,
        }
      }
      const text = await resp.text()
      this.#cFetchCache.set(url, text)
    }
    const cachedText = this.#cFetchCache.get(url)
    return {
      status: 200,
      json() {
        return Promise.resolve(JSON.parse(cachedText))
      }
    }
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
      const resp = await this.cFetch(`${splitPrecompMeshVol[0]}/transform.json`)
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
          name: "Auxiliary mesh"
        }]
      })
    }
    return returnObj
  }

  async #translatePoint(point: components["schemas"]["CoordinatePointModel"]): Promise<Point> {
    const getTmpl = (id: string) => {
      return this.#sxplrTmplMap.get(id)
    }
    return {
      loc: point.coordinates.map(v => v.value) as [number, number, number],
      get space() {
        return getTmpl(point.coordinateSpace['@id'])
      }
    }
  }

  async translateFeature(feat: PathReturn<"/feature/{feature_id}">): Promise<TabularFeature<number|string|number[]>|VoiFeature|Feature> {
    if (this.#isTabular(feat)) {
      return await this.translateTabularFeature(feat)
    }
    if (this.#isVoi(feat)) {
      return await this.translateVoiFeature(feat)
    }
    
    return await this.translateBaseFeature(feat)
  }

  async translateBaseFeature(feat: PathReturn<"/feature/{feature_id}">): Promise<Feature>{
    const { id, name, category, description, datasets } = feat
    const dsDescs = datasets.map(ds => ds.description)
    const urls = datasets.flatMap(ds => ds.urls).map(v => ({
      href: v.url,
      text: 'link to dataset'
    }))
    return {
      id,
      name,
      category,
      desc: dsDescs[0] || description,
      link: urls,
    }
  }

  #isVoi(feat: unknown): feat is PathReturn<"/feature/Image/{feature_id}"> {
    return feat['@type'].includes("feature/volume_of_interest")
  }

  async translateVoiFeature(feat: PathReturn<"/feature/Image/{feature_id}">): Promise<VoiFeature> {
    const [superObj, { loc: center }, { loc: maxpoint }, { loc: minpoint }, { "neuroglancer/precomputed": precomputedVol }] = await Promise.all([
      this.translateBaseFeature(feat),
      this.#translatePoint(feat.boundingbox.center),
      this.#translatePoint(feat.boundingbox.maxpoint),
      this.#translatePoint(feat.boundingbox.minpoint),
      this.#extractNgPrecompUnfrag(feat.volume.providedVolumes),
    ])
    const { ['@id']: spaceId } = feat.boundingbox.space
    const getSpace = (id: string) => this.#sxplrTmplMap.get(id)
    const bbox: BoundingBox = {
      center,
      maxpoint,
      minpoint,
      get space() {
        return getSpace(spaceId)
      }
    }
    return {
      ...superObj,
      bbox,
      ngVolume: precomputedVol
    }
  }

  #isTabular(feat: unknown): feat is PathReturn<"/feature/Tabular/{feature_id}"> {
    return feat["@type"].includes("feature/tabular")
  }
  async translateTabularFeature(feat: unknown): Promise<TabularFeature<number | string| number[]>> {
    if (!this.#isTabular(feat)) throw new Error(`Feature is not of tabular type`)
    const superObj = await this.translateBaseFeature(feat)
    const { data: _data } = feat
    const { index, columns, data } = _data || {}
    return {
      ...superObj,
      columns,
      index,
      data
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
