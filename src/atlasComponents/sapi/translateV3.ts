import {
  SxplrAtlas, SxplrParcellation, SxplrTemplate, SxplrRegion, NgLayerSpec, NgPrecompMeshSpec, NgSegLayerSpec, VoiFeature, Point, TThreeMesh, LabelledMap, CorticalFeature, Feature, GenericInfo, BoundingBox, SimpleCompoundFeature
} from "./sxplrTypes"
import { PathReturn, MetaV1Schema, /* CompoundFeature */ } from "./typeV3"
import { hexToRgb } from 'common/util'
import { components } from "./schemaV3"
import { defaultdict, getFactor, getShaderFromMeta } from "src/util/fn"

export function parseUrl(url: string): {protocol: string, host: string, path: string} {
  const urlProtocolPattern = /^(blob:)?([^:/]+):\/\/([^/]+)((?:\/.*)?)$/;
  const match = url.match(urlProtocolPattern);
  if (match === null) {
    throw new Error(`Invalid URL: ${JSON.stringify(url)}`);
  }
  return {protocol: match[2], host: match[3], path: match[4]};
}

const BIGBRAIN_XZ = [
  [-70.677, 62.222],
  [-70.677, -58.788],
  [68.533, -58.788],
  [68.533, 62.222],
]

function metaFactory(url: string): MetaV1Schema{
  if (url.includes("ucl-hip")) {
    return {
      version: 1,
      preferredColormap: ["greyscale"],
      data: {
        type: "image/1d",
        range: [{
          min: 0.218,
          max: 0.220
        }]
      }
    }
  }
  if (url.includes("tanner")) {
    return {
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
    }
  }
  if (url.includes("gaba_bz")) {
    return {
      version: 1,
      preferredColormap: ["magma"],
      data: {
        type: "image/1d",
        range: [{
          min: 0,
          max: 10000
        }]
      }
    }
  }
  return null
}

const TMP_META_REGISTRY: Record<string, MetaV1Schema> = {
  "https://1um.brainatlas.eu/pli-bigbrain/fom/precomputed": {
    version: 1,
    data: {
      type: "image/3d"
    },
    transform: [[7.325973427896315e-8,2.866510051546811e-8,-1,-16600000],[-0.9899035692214966,0.14174138009548187,-6.845708355740499e-8,70884888],[-0.14174138009548187,-0.9899035692214966,-3.875962661936683e-8,64064704],[0,0,0,1]],
    bestViewPoints: [{
      type: "enclosed",
      points: [{
        type: "point",
        value: [-16.625, -81.397, 42.385]
      },{
        type: "point",
        value: [-16.625, -65.063, -67.262]
      },{
        type: "point",
        value: [-16.625, 85.858, -44.395]
      },{
        type: "point",
        value: [-16.625, 71.157, 63.871]
      }]
    }],
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
      ...rest,
      id: parcellation["@id"],
      name: parcellation.name,
      modality: parcellation.modality,
      type: "SxplrParcellation",
      prevId,
      shortName: parcellation.shortname,
    }
  }

  #templateMap: Map<string, PathReturn<"/spaces/{space_id}">> = new Map()
  #sxplrTmplMap: Map<string, SxplrTemplate> = new Map()
  retrieveTemplate(template:SxplrTemplate): PathReturn<"/spaces/{space_id}"> {
    return this.#templateMap.get(template.id)
  }
  async translateTemplate(template:PathReturn<"/spaces/{space_id}">): Promise<SxplrTemplate> {
    
    const ds = await Promise.all((template.datasets || []).map(ds => this.translateDs(ds)))
    const { ...rest } = ds[0] || {}

    this.#templateMap.set(template["@id"], template)
    const tmpl: SxplrTemplate = {
      ...rest,
      id: template["@id"],
      name: template.fullName,
      shortName: template.shortName,
      type: "SxplrTemplate" as const,
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
    
    const bestViewPoint = region.hasAnnotation?.bestViewPoint

    return {
      id: region["@id"],
      name: region.name,
      color: hexToRgb(region.hasAnnotation?.displayColor) as [number, number, number],
      parentIds: (region.hasParent || []).map( v => v["@id"] ),
      type: "SxplrRegion",
      centroid: bestViewPoint
        ? {
          loc: bestViewPoint.coordinates.map(v => v.value) as [number, number, number],
          spaceId: bestViewPoint.coordinateSpace['@id']
        }
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
      format: string
      url: string
      transform: number[][]
      info: Record<string, any>
      meta?: MetaV1Schema
    }> = {}
    for (const key in input) {
      if (key !== 'neuroglancer/precomputed' && key !== 'zarr2') {
        continue
      }
      const url = input[key].replace(/\/+$/, '')
      const [ transform, info, meta ] = await Promise.all([
        this.cFetch(`${url}/transform.json`).then(res => res.json()) as Promise<number[][]>,
        this.fetchInfo(url, key),
        this.fetchMeta(url),
      ])
      returnObj[key] = {
        format: key,
        url: input[key],
        transform: transform,
        info,
        meta,
      }
    }
    return returnObj
  }

  async translateSpaceToVolumeImageMeta(template: SxplrTemplate): Promise<{
    type: string
    url: string
    meta: MetaV1Schema
  }[]>{
    const returnVal: {
      type: string
      url: string
      meta: MetaV1Schema
    }[] = []
    if (!template) return returnVal
    const space = this.retrieveTemplate(template)
    if (!space) return returnVal

    // TODO make work with other formats, e.g. fsaverage
    const validImages = space.defaultImage.filter(di => di.formats.includes("neuroglancer/precomputed"))
    for (const defaultImage of validImages) {
      
      const { providedVolumes } = defaultImage
      // TODO fix zarr/other format space volume image
      const { "neuroglancer/precomputed": precomputedVol } = await this.#extractNgPrecompUnfrag(providedVolumes)
      
      if (!precomputedVol) {
        console.error(`neuroglancer/precomputed data source has not been found!`)
        continue
      }
      const { url, meta } = precomputedVol
      returnVal.push({
        type: "neuroglancer/precomputed",
        url,
        meta,
      })
    }
    return returnVal
  }

  async translateSpaceToVolumeImage(template: SxplrTemplate): Promise<NgLayerSpec[]> {
    if (!template) return []
    const space = this.retrieveTemplate(template)
    if (!space) return []
    const returnObj: NgLayerSpec[] = []
    
    // TODO fix zarr/other format space volume image
    const validImages = space.defaultImage.filter(di => di.formats.includes("neuroglancer/precomputed"))

    for (const defaultImage of validImages) {
      
      const { providedVolumes } = defaultImage
      const { "neuroglancer/precomputed": precomputedVol } = await this.#extractNgPrecompUnfrag(providedVolumes)
      
      if (!precomputedVol) {
        console.error(`neuroglancer/precomputed data source has not been found!`)
        continue
      }
      const { transform, info: _info, url, meta } = precomputedVol
      const { resolution, size } = _info.scales[0]
      const info = {
        voxel: size as [number, number, number],
        real: [0, 1, 2].map(idx => resolution[idx] * size[idx]) as [number, number, number],
        resolution: resolution as [number, number, number]
      }
      const obj: NgLayerSpec = {
        source: `precomputed://${url}`,
        legacySpecFlag: "old",
        transform,
        shader: getShaderFromMeta(meta),
        info,
      }
      returnObj.push(obj)
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
    const threeLabelMap: Record<string, {
      laterality: 'left' | 'right'
      url: string
      region: LabelledMap[]
      clType: 'baselayer/threesurfer-label/gii-label' | 'baselayer/threesurfer-label/annot'
    }> = {}
    const registerLayer = (url: string, clType: 'baselayer/threesurfer-label/gii-label' | 'baselayer/threesurfer-label/annot', laterality: 'left' | 'right', region: string, label: number) => {
      if (!threeLabelMap[url]) {
        threeLabelMap[url] = {
          laterality,
          region: [],
          url,
          clType
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
        let clType: 'baselayer/threesurfer-label/gii-label' | 'baselayer/threesurfer-label/annot' | null = null
        let providedVolume: typeof volume['providedVolumes'][string] | null = null
        if (volume.formats.includes("gii-label")) {
          clType = 'baselayer/threesurfer-label/gii-label'
          providedVolume = volume.providedVolumes["gii-label"]
        }
        if (volume.formats.includes("freesurfer-annot")) {
          clType = 'baselayer/threesurfer-label/annot'
          providedVolume = volume.providedVolumes["freesurfer-annot"]
        }
        
        if (!providedVolume || !clType) {
          // does not support  baselayer threesurfer label, skipping
          continue
        }
        if (!fragment || !["left hemisphere", "right hemisphere"].includes(fragment)) {
          console.warn(`either fragment not defined, or fragment is not '{left|right} hemisphere'. Skipping!`)
          continue
        }
        if (!providedVolume[fragment]) {
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
        registerLayer(providedVolume[fragment], clType, laterality, regionname, label)
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
            legacySpecFlag: "old",
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
      const { host, path, protocol } = parseUrl(url)
      if (protocol === "gs") {
        const _path = encodeURIComponent(path.substring(1))
        url = `https://www.googleapis.com/storage/v1/b/${host}/o/${_path}?alt=media`
      }
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

  async fetchInfo(url: string, format: string) {
    if (format === "neuroglancer/precomputed") {
      return this.cFetch(`${url}/info`).then(res => res.json())
    }
    if (format === "zarr2") {
      const _url = url.replace(/\/+$/, '')
      const zattrs = await this.cFetch(`${_url}/.zattrs`).then(res => res.json())
      const multiscale = zattrs.multiscales[0]
      
      const factors = multiscale.axes.map(axis => getFactor(axis.unit) * 1e9)
      const { path, coordinateTransformations } = multiscale.datasets[0]
      const axesScaling = coordinateTransformations[0]
      if (axesScaling.type !== "scale") {
        throw new Error(`Expected the first coordinate transform to be scaling, but was ${axesScaling.type}`)
      }
      const resolution = [0, 1, 2].map(idx => factors[idx] * axesScaling.scale[idx])

      const zarray = await this.cFetch(`${_url}/${path}/.zarray`).then(res => res.json())

      return {
        scales: [
          {
            size: zarray.shape,
            resolution
          }
        ]
      }
    }
  }

  async fetchMeta(url: string): Promise<MetaV1Schema|null> {
    // TODO move to neuroglancer-data-vm
    // difumo
    if (url.startsWith("https://object.cscs.ch/v1/AUTH_08c08f9f119744cbbf77e216988da3eb/")) {
      return {
        version: 1
      }
    }
    const meta = metaFactory(url)
    if (meta) {
      return meta
    }
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
    try{
      const resp = await this.cFetch(`${url}/meta.json`)
      if (resp.status === 200) {
        return resp.json()
      }
    // eslint-disable-next-line no-empty
    } catch (e) {
      
    }
    
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
        legacySpecFlag: "old",
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
    return {
      loc: point.coordinates.map(v => v.value) as [number, number, number],
      spaceId: point.coordinateSpace['@id'],
    }
  }

  async translateFeature(feat: PathReturn<"/feature/{feature_id}">): Promise<VoiFeature|Feature|SimpleCompoundFeature> {
    if (this.#isVoi(feat)) {
      return await this.translateVoiFeature(feat)
    }
    // if (this.#isCompound(feat)) {
    //   const link = feat.datasets.flatMap(ds => ds.urls).map(v => ({
    //     href: v.url,
    //     text: v.url
    //   }))
    //   const v: SimpleCompoundFeature = {
    //     id: feat.id,
    //     name: feat.name,
    //     category: feat.category,
    //     indices: await Promise.all(
    //       feat.indices.map(
    //         async ({ id, index, name }) => ({
    //           id,
    //           index: await this.#transformIndex(index),
    //           name,
    //           category: feat.category
    //         })
    //       )
    //     ),
    //     desc: feat.description,
    //     link
    //   }
    //   return v
    // }
    
    return await this.translateBaseFeature(feat)
  }

  async translateBaseFeature(feat: PathReturn<"/feature/{feature_id}">): Promise<Feature>{
    const { id, name, category, description, datasets } = feat
    if (!datasets) {
      return {
        id, name, category
      }
    }
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

  // #isCompound(feat: unknown): feat is CompoundFeature {
  //   return feat['@type'].includes("feature/compoundfeature")
  // }

  // async #transformIndex(index: CompoundFeature['indices'][number]['index']): Promise<SimpleCompoundFeature['indices'][number]['index']> {
  //   if (typeof index === "string") {
  //     return index
  //   }
  //   return await this.#translatePoint(index)
    
  // }

  async translateVoiFeature(feat: PathReturn<"/feature/Image/{feature_id}">): Promise<VoiFeature> {
    const [superObj, { loc: center }, { loc: maxpoint }, { loc: minpoint }, { "neuroglancer/precomputed": precomputedVol, "zarr2": zarrVol }] = await Promise.all([
      this.translateBaseFeature(feat),
      this.#translatePoint(feat.boundingbox.center),
      this.#translatePoint(feat.boundingbox.maxpoint),
      this.#translatePoint(feat.boundingbox.minpoint),
      this.#extractNgPrecompUnfrag(feat.volume.providedVolumes),
    ])
    const { ['@id']: spaceId } = feat.boundingbox.space
    const bbox: BoundingBox = {
      center,
      maxpoint,
      minpoint,
      spaceId
    }
    return {
      ...superObj,
      bbox,
      ngVolume: precomputedVol || zarrVol
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

  getSpaceFromId(id: string): SxplrTemplate {
    return this.#sxplrTmplMap.get(id)
  }
}

export const translateV3Entities = new TranslateV3()


// TODO 
// >= 0.3.18 siibra-api /maps endpoint populates *both* full region name as well as short names
// This is a side effect of mixing both versions of siibra-python.
// and expected to end at >= 0.4. By then, restore this warning for debugging purposes

const REMOVE_FROM_NAMES = [
  "hemisphere",
  " -",
  "-brain",
  "both",
  "Both",
]
const REPLACE_IN_NAME = {
  "ctx-lh-": "left ",
  "ctx-rh-": "right ",
}

export function translateRegionName(fullRegionName: string): string {
  let returnName = fullRegionName
  for (const rm of REMOVE_FROM_NAMES) {
    returnName = returnName.replace(rm , "")
  }
  for (const key in REPLACE_IN_NAME){
    returnName = returnName.replace(key, REPLACE_IN_NAME[key])
  }
  return returnName.trim()
}

// end TODO
