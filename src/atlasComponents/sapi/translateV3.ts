import {
  SxplrAtlas, SxplrParcellation, SxplrTemplate, SxplrRegion, NgLayerSpec, NgPrecompMeshSpec, NgSegLayerSpec, VoiFeature, Point, TThreeMesh, LabelledMap, CorticalFeature, Feature, GenericInfo, BoundingBox
} from "./sxplrTypes"
import { PathReturn, MetaV1Schema } from "./typeV3"
import { hexToRgb } from 'common/util'
import { components } from "./schemaV3"
import { defaultdict } from "src/util/fn"


const BIGBRAIN_XZ = [
  [-70.677, 62.222],
  [-70.677, -58.788],
  [68.533, -58.788],
  [68.533, 62.222],
]

const TMP_META_REGISTRY: Record<string, MetaV1Schema> = {
  "https://data-proxy.ebrains.eu/api/v1/public/buckets/tanner-test/fullSharded_v1": {
    version: 1,
    preferredColormap: ["greyscale"],
    data: {
      type: "image/1d",
      range: [{
        min: 0.2,
        max: 0.4
      }]
    },
    transform: [[-1,0,0,5662500],[0,0,1,-6562500],[0,-1,0,3962500],[0,0,0,1]]
  },
  "https://1um.brainatlas.eu/pli-bigbrain/fom/precomputed": {
    version: 1,
    data: {
      type: "image/3d"
    },
    bestViewPoints: [{
      type: "enclosed",
      points: [{
        type: "point",
        value: [-16.625, -80.813, 41.801]
      },{
        type: "point",
        value: [-16.625, -64.293, -66.562]
      },{
        type: "point",
        value: [-16.625, 86.557, -42.685]
      },{
        type: "point",
        value: [-16.625, 69.687, 63.015]
      }]
    }],
    transform: [[7.325973427896315e-8,2.866510051546811e-8,-1,-16600000],[-0.9899035692214966,0.14174138009548187,-6.845708355740499e-8,70884888],[-0.14174138009548187,-0.9899035692214966,-3.875962661936683e-8,64064704],[0,0,0,1]]
  },
  "https://1um.brainatlas.eu/cyto_reconstructions/ebrains_release/BB_1um/VOI_1/precomputed": {
    version: 1,
    data: {
      type: "image/1d"
    },
    preferredColormap: ["greyscale"],
    bestViewPoints: [{
      type: "enclosed",
      points: [{
        type: "point",
        value: [-11.039, -58.450, 4.311]
      },{
        type: "point",
        value: [-9.871, -58.450, -1.649]
      },{
        type: "point",
        value: [-3.947, -58.450, -0.377]
      },{
        type: "point",
        value: [-5.079, -58.450, 5.496]
      }]
    }],
    transform: [[0.9986788630485535,0.1965026557445526,0.27269935607910156,-11887736],[0,0,1,-61450000],[0.20538295805454254,-0.9990047812461853,0.052038706839084625,4165836.25],[0,0,0,1]]
  },
  "https://1um.brainatlas.eu/cyto_reconstructions/ebrains_release/BB_1um/VOI_2/precomputed": {
    version: 1,
    data: {
      type: "image/1d"
    },
    preferredColormap: ["greyscale"],
    bestViewPoints: [{
      type: "enclosed",
      points: [{
        type: "point",
        value: [-10.011, -58.450, -2.879]
      },{
        type: "point",
        value: [-8.707, -58.450, -8.786]
      },{
        type: "point",
        value: [-3.305, -58.450, -7.728]
      },{
        type: "point",
        value: [-4.565, -58.450, -1.703]
      }]
    }],
    transform: [[0.9199221134185791,0.22926874458789825,0.2965584993362427,-10976869],[0,0,1,-61450000],[0.18267445266246796,-1.0079853534698486,0.01068924367427826,-2853557],[0,0,0,1]]
  },
  "https://neuroglancer.humanbrainproject.eu/precomputed/data-repo/HSV-FOM": {
    version: 1,
    data: {
      type: "image/3d"
    },
    transform: [[-0.74000001,0,0,38134608],[0,-0.26530117,-0.6908077,13562314],[0,-0.6908077,0.26530117,-3964904],[0,0,0,1]]
  },
  "https://1um.brainatlas.eu/pli-bigbrain/masked/precomputed": {
    version: 1,
    data: {
        type: "image/3d"
    },
    transform: [[0.09610333293676376,0.18529105186462402,1.1221941709518433,-86564752],[-0.9440627098083496,-0.05010826885700226,0.0727924108505249,80961928],[-0.11565766483545303,-0.9673581719398499,-0.038424473255872726,75194496],[0,0,0,1]]
  },
  "https://neuroglancer.humanbrainproject.eu/precomputed/data-repo-ng-bot/siibra-config/chenonceau-200-um-dti-fractional-anisotropy/dti_fa_200um": {
    version: 1,
    data: {
        type: "image/1d"
    },
    preferredColormap: ["magma"],
    transform: [[-0.2, 0.0, 0.0, 96400000.0], [0.0, -0.2, 0.0, 96400000.0], [0.0, 0.0, -0.2, 114400000.0], [0.0, 0.0, 0.0, 1.0]]
  },
  "https://neuroglancer.humanbrainproject.eu/precomputed/chenonceau_dti_rgb_200um/precomputed": {
      version: 1,
      data: {
          type: "image/3d"
      },
      transform: [[-0.2, 0.0, 0.0, 96400000.0], [0.0, -0.2, 0.0, 96400000.0], [0.0, 0.0, -0.2, 114400000.0], [0.0, 0.0, 0.0, 1.0]]
  },
  "https://1um.brainatlas.eu/broca/neun": {
      version: 1,
      data: {
          type: "image/1d",
          range: [{
              "min": 0.0,
              "max": 0.03
          }]
      },
      preferredColormap: ["greyscale"],
      transform: [[-0.7522572875022888,0.49253523349761963,0,-23501134],[-0.49253523349761963,-0.7522572875022888,0,73817088],[0,0,0.8991562724113464,-5074088.5],[0,0,0,1]]
  },
  "https://neuroglancer.humanbrainproject.eu/precomputed/data-repo-ng-bot/siibra-config/wikibrainstem-original/TRONC_001_11.7T_100um_pub_ORIGINAL": {
      version: 1,
      data: {
          type: "image/1d",
          range: [{
              "min": 0.0,
              "max": 0.03
          }]
      },
      preferredColormap: ["greyscale"],
      transform: [[0.9884678721427917,0.020477699115872383,-0.15004022419452667,-13731683],[0.08980953693389893,0.7184783816337585,0.6897274255752563,-62889108],[0.12192454934120178,-0.6952477097511292,0.7083531022071838,-44303880],[0,0,0,1]]
  },
  "https://neuroglancer.humanbrainproject.eu/precomputed/data-repo-ng-bot/siibra-config/chenonceau-anatomy-200um/anatomy_200um": {
      version: 1,
      data: {
          type: "image/1d",
          range: [{
              "min": 0.0,
              "max": 0.01
          }]
      },
      preferredColormap: ["greyscale"],
      transform: [[-0.2, 0.0, 0.0, 96400000.0], [0.0, -0.2, 0.0, 96400000.0], [0.0, 0.0, -0.2, 114400000.0], [0.0, 0.0, 0.0, 1.0]]
  },
  "https://neuroglancer.humanbrainproject.eu/precomputed/data-repo-ng-bot/siibra-config/chenonceau-anatomy-150-um/anatomy_150um": {
      version: 1,
      data: {
          type: "image/1d",
          range: [{
              "min": 0.0,
              "max": 0.001
          }]
      },
      preferredColormap: ["greyscale"],
      transform: [[-0.15, 0.0, 0.0, 96425000.0], [0.0, -0.15, 0.0, 96425000.0], [0.0, 0.0, -0.15, 114425000.0], [0.0, 0.0, 0.0, 1.0]]
  },
  "https://1um.brainatlas.eu/salditt/AD_10_PB_7x7-stitch/precomputed": {
    version: 1,
    data: {
        type: "image/1d"
    },
    preferredColormap: ["jet"],
    transform: [[0.2069708704948425, 0.9783469713651216, 0.0, -27572548.0], [-3.348740908502525e-08, 7.084309890851377e-09, -0.9999999633202186, -2800959.25], [0.9783469713651216, -0.2069708704948425, -3.422853248698979e-08, -16159642.0], [0.0, 0.0, 0.0, 1.0]]
  }
}

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
      meta?: MetaV1Schema
    }> = {}
    for (const key in input) {
      if (key !== 'neuroglancer/precomputed') {
        continue
      }
      const url = input[key]
      const [ transform, info, meta ] = await Promise.all([
        this.cFetch(`${url}/transform.json`).then(res => res.json()) as Promise<number[][]>,
        this.cFetch(`${url}/info`).then(res => res.json()) as Promise<Record<string, any>>,
        this.fetchMeta(url),
      ])
      returnObj[key] = {
        url: input[key],
        transform: transform,
        info: info,
        meta,
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

  async fetchMeta(url: string): Promise<MetaV1Schema|null> {
    if (url in TMP_META_REGISTRY) {
      return TMP_META_REGISTRY[url]
    }
    const is1umRegisteredSlices = url.startsWith("https://1um.brainatlas.eu/registered_sections/bigbrain")
    if (is1umRegisteredSlices) {
      const found = /B20_([0-9]{4})/.exec(url)
      if (found) {
        const sectionId = parseInt(found[1])
        const realYDis = (sectionId * 2e4 - 70010000) / 1e6
        return {
          version: 1,
          preferredColormap: ["greyscale"],
          bestViewPoints: [{
            type: "enclosed",
            points: BIGBRAIN_XZ.map(([x, z]) => ({
              type: "point",
              value: [x, realYDis, z]
            }))
          }]
        }
      }
    }
    /**
     * TODO ensure all /meta endpoints are populated
     */
    // try{
    //   const resp = await this.cFetch(`${url}/meta`)
    //   if (resp.status === 200) {
    //     return resp.json()
    //   }
    // } catch (e) {
      
    // }
    
    return null
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

  async translateFeature(feat: PathReturn<"/feature/{feature_id}">): Promise<VoiFeature|Feature> {
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
      text: v.url
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
