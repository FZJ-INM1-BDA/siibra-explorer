// this module is suppose to rewrite state stored in query param
// and convert it to path based url
const separator = '.'
const waxolmObj = {
  aId: 'minds/core/parcellationatlas/v1.0.0/522b368e-49a3-49fa-88d3-0870a307974a',
  id: 'minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8',
  parc: {
    'Waxholm Space rat brain atlas v3': {
      id: 'minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe'
      },
    'Whole Brain (v2.0)': {
      id: 'minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d'
    },
    'Waxholm Space rat brain atlas v2': {
      id: 'minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d'
      },
    'Waxholm Space rat brain atlas v1': {
      id: 'minds/core/parcellationatlas/v1.0.0/11017b35-7056-4593-baad-3934d211daba'
    },
  }
}

const allenObj = {
  aId: 'juelich/iav/atlas/v1.0.0/2',
  id: 'minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9',
  parc: {
    'Allen Mouse Common Coordinate Framework v3 2017': {
      id: 'minds/core/parcellationatlas/v1.0.0/05655b58-3b6f-49db-b285-64b5a0276f83'
    },
    'Allen Mouse Brain Atlas': {
      id: 'minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f'
    },
    'Allen Mouse Common Coordinate Framework v3 2015': {
      id: 'minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f'
    },
  }
}

const templateMap = {
  'Big Brain (Histology)': {
    aId: 'juelich/iav/atlas/v1.0.0/1',
    id: 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588',
    parc: {
      'Cytoarchitectonic Maps - v2.4': {
        id: 'juelich/iav/atlas/v1.0.0/7'
      },
      'Cortical Layers Segmentation': {
        id: 'juelich/iav/atlas/v1.0.0/3'
      },
      'Grey/White matter': {
        id: 'juelich/iav/atlas/v1.0.0/4'
      }
    }
  },
  'MNI 152 ICBM 2009c Nonlinear Asymmetric': {
    aId: 'juelich/iav/atlas/v1.0.0/1',
    id: 'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2',
    parc: {
      'Cytoarchitectonic Maps - v2.5.1': {
        id: 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-26'
      },
      'Short Fiber Bundles - HCP': {
        id: 'juelich/iav/atlas/v1.0.0/79cbeaa4ee96d5d3dfe2876e9f74b3dc3d3ffb84304fb9b965b1776563a1069c'
      },
      'Cytoarchitectonic maps - v1.18': {
        id: 'juelich/iav/atlas/v1.0.0/8'
      },
      'Long Bundle': {
        id: 'juelich/iav/atlas/v1.0.0/5'
      },
      'fibre bundle short': {
        id: 'juelich/iav/atlas/v1.0.0/6'
      },
      'DiFuMo Atlas (64 dimensions)': {
        id: 'minds/core/parcellationatlas/v1.0.0/d80fbab2-ce7f-4901-a3a2-3c8ef8a3b721'
      },
      'DiFuMo Atlas (128 dimensions)': {
        id: 'minds/core/parcellationatlas/v1.0.0/73f41e04-b7ee-4301-a828-4b298ad05ab8'
      },
      'DiFuMo Atlas (256 dimensions)': {
        id: 'minds/core/parcellationatlas/v1.0.0/141d510f-0342-4f94-ace7-c97d5f160235'
      },
      'DiFuMo Atlas (512 dimensions)': {
        id: 'minds/core/parcellationatlas/v1.0.0/63b5794f-79a4-4464-8dc1-b32e170f3d16'
      },
      'DiFuMo Atlas (1024 dimensions)': {
        id: 'minds/core/parcellationatlas/v1.0.0/12fca5c5-b02c-46ce-ab9f-f12babf4c7e1'
      },
    },
  },
  'MNI Colin 27': {
    aId: 'juelich/iav/atlas/v1.0.0/1',
    id: 'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992',
    parc: {
      'Cytoarchitectonic Maps - v1.18': {
        id: 'juelich/iav/atlas/v1.0.0/8'
      }
    }
  },
  'Waxholm Space rat brain MRI/DTI': waxolmObj,
  'Waxholm Rat V2.0': waxolmObj,
  'Allen Mouse Common Coordinate Framework v3': allenObj,
  'Allen Mouse': allenObj
}

const encodeId = id => id.replace(/\//g, ':')

const WARNING_STRINGS = {
  PREVIEW_DSF_PARSE_ERROR: 'Preview dataset files cannot be processed properly.',
  REGION_SELECT_ERROR: 'Region selected cannot be processed properly.',
  TEMPLATE_ERROR: 'Template not found.',
}

module.exports = (query, _warningCb) => {
  const {
    standaloneVolumes,
    niftiLayers, // deprecating - check if anyone calls this url
    pluginStates,
    previewingDatasetFiles,

    templateSelected,
    parcellationSelected,
    regionsSelected, // deprecating - check if any one calls this url
    cRegionsSelected,

    navigation, // deprecating - check if any one calls this endpoint
    cNavigation,
  } = query || {}

  if (Object.keys(query).length === 0) return null

  /**
   * nb: it is absolutely imperative that warningCb are not called with dynamic data.
   * Since it is injected as param in 
   */
  const warningCb = arg => {
    if (!_warningCb) return
    if (Object.values(WARNING_STRINGS).includes(arg)) _warningCb(arg)
  }

  if (navigation) console.warn(`navigation has been deprecated`)
  if (regionsSelected) console.warn(`regionSelected has been deprecated`)
  if (niftiLayers) console.warn(`nifitlayers has been deprecated`)

  // pluginStates from query param were separated by __
  // convert to uri component encoded JSON array
  // to avoid potentially issues (e.g. url containing __, which is very possible)

  const plugins = pluginStates && pluginStates.split('__')
  const searchParam = new URLSearchParams()


  // common search param & path
  let nav, dsp, r
  if (cNavigation) nav = `/@:${encodeURI(cNavigation)}`
  if (previewingDatasetFiles) {
    try {
      const parsedDsp = JSON.parse(previewingDatasetFiles)
      if (Array.isArray(parsedDsp)) {
        if (parsedDsp.length === 1) {
          const { datasetId, filename } = parsedDsp[0]
          dsp = `/dsp:${encodeId(datasetId)}::${encodeURI(filename)}`
        } else {
          searchParam.set(`previewingDatasetFiles`, previewingDatasetFiles)
        }
      }
    } catch (_e) {
      warningCb(WARNING_STRINGS.PREVIEW_DSF_PARSE_ERROR)
      // parsing preview dataset error
      // ignore preview dataset query param
    }
  }
  if (plugins && plugins.length > 0) {
    searchParam.set(`pl`, JSON.stringify(plugins))
  }
  if (niftiLayers) searchParam.set(`niftiLayers`, niftiLayers)
  if (cRegionsSelected) {
    try {
      (() => {
        const parsedRS = JSON.parse(cRegionsSelected)
        if (Object.keys(parsedRS).length > 1) {
          searchParam.set('cRegionsSelected', cRegionsSelected)
          return
        }
        for (const ngId in parsedRS) {
          const encodedIdArr = parsedRS[ngId]
          const encodedRArr = encodedIdArr.split(separator)
          if (encodedRArr.length > 0) {
            if (encodedRArr.length > 1) {
              searchParam.set('cRegionsSelected', cRegionsSelected)
              return
            }
            if (!!encodedRArr[0]) {
              r = `/r:${encodeURI(ngId)}::${encodeURI(encodedRArr[0])}`
            }
          }
        }
      })()
    } catch (e) {
      warningCb(WARNING_STRINGS.REGION_SELECT_ERROR)
      // parsing cregions selected error
      // ignore region selected and move on
    }
  }
  const HOST_PATHNAME = process.env.HOST_PATHNAME || ''
  let redirectUrl = `${HOST_PATHNAME}/#`
  if (standaloneVolumes) {
    searchParam.set('standaloneVolumes', standaloneVolumes)
    if (nav) redirectUrl += nav
    if (dsp) redirectUrl += dsp
    if (Array.from(searchParam.keys()).length > 0) redirectUrl += `/?${searchParam.toString()}`
    return redirectUrl
  }

  if (templateSelected) {
    if (templateMap[templateSelected]) {

      const { id: t, aId: a, parc } = templateMap[templateSelected]
      redirectUrl += `/a:${encodeId(a)}/t:${encodeId(t)}`
      if (!parc[parcellationSelected]) {
        warningCb(`Parcelation not found, using default.`)
      }
      const { id: p } = parc[parcellationSelected] || {}
      if (p) redirectUrl += `/p:${encodeId(p)}`
      if (r) redirectUrl += r
      if (nav) redirectUrl += nav
      if (dsp) redirectUrl += dsp
      
      if (Array.from(searchParam.keys()).length > 0) redirectUrl += `?${searchParam.toString()}`
  
      return redirectUrl
    } else {
      warningCb(WARNING_STRINGS.TEMPLATE_ERROR)
    }
  }

  if (Array.from(searchParam.keys()).length > 0) {
    redirectUrl += `/?${searchParam.toString()}`
    return redirectUrl
  }
  return `${redirectUrl}/`
}
