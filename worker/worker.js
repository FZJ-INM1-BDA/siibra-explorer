const vtkHeader = `# vtk DataFile Version 2.0
Created by worker thread at https://github.com/HumanBrainProject/interactive-viewer
ASCII
DATASET POLYDATA`

globalThis.constants = {
  vtkHeader
}

if (typeof self.importScripts === 'function')  self.importScripts('./worker-plotly.js')
if (typeof self.importScripts === 'function')  self.importScripts('./worker-nifti.js')
if (typeof self.importScripts === 'function')  self.importScripts('./worker-typedarray.js')
if (typeof self.importScripts === 'function')  self.importScripts('./worker-regionFilter.js')


const VALID_METHOD = {
  PROCESS_PLOTLY: `PROCESS_PLOTLY`,
  PROCESS_NIFTI: 'PROCESS_NIFTI',
  PROCESS_TYPED_ARRAY: `PROCESS_TYPED_ARRAY`,
  PROCESS_TYPED_ARRAY_F2RGBA: `PROCESS_TYPED_ARRAY_F2RGBA`,
  PROCESS_TYPED_ARRAY_CM2RGBA: "PROCESS_TYPED_ARRAY_CM2RGBA",
  PROCESS_TYPED_ARRAY_RAW: "PROCESS_TYPED_ARRAY_RAW",
  FILTER_REGIONS: "FILTER_REGIONS"
}

const VALID_METHODS = [
  VALID_METHOD.PROCESS_PLOTLY,
  VALID_METHOD.PROCESS_NIFTI,
  VALID_METHOD.PROCESS_TYPED_ARRAY,
  VALID_METHOD.PROCESS_TYPED_ARRAY_F2RGBA,
  VALID_METHOD.PROCESS_TYPED_ARRAY_CM2RGBA,
  VALID_METHOD.PROCESS_TYPED_ARRAY_RAW,
  VALID_METHOD.FILTER_REGIONS,
]

const encoder = new TextEncoder()

let userLandmarkVtkUrl

let plotyVtkUrl

onmessage = (message) => {
  // in dev environment, webpack ok is sent
  if (message.data.type === 'webpackOk') return

  if (message.data.method && VALID_METHODS.indexOf(message.data.method) >= 0) {
    const { id, method, param } = message.data || {}
    if (method === VALID_METHOD.PROCESS_PLOTLY) {
      try {
        if (plotyVtkUrl) URL.revokeObjectURL(plotyVtkUrl)
        const { data: plotlyData } = message.data.param
        const {
          vtkString,
          customFragmentColor
        } = self.plotly.convert(plotlyData)
        const plotyVtkUrl = URL.createObjectURL(
          new Blob([ encoder.encode(vtkString) ], { type: 'application/octet-stream' })
        )
        postMessage({
          id,
          result: {
            objectUrl: plotyVtkUrl,
            customFragmentColor
          }
        })
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `malformed plotly param: ${e.toString()}`
          }
        })
      }
    }

    if (method === VALID_METHOD.PROCESS_NIFTI) {
      try {
        const { nifti } = param
        const {
          meta,
          buffer
        } = self.nifti.convert(nifti)

        postMessage({
          id,
          result: {
            meta,
            buffer
          }
        }, [ buffer ])
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `nifti error: ${e.toString()}`
          }
        })
      }
    }
    if (method === VALID_METHOD.PROCESS_TYPED_ARRAY) {
      try {
        const { inputArray, dtype, width, height, channel } = param
        const array = self.typedArray.packNpArray(inputArray, dtype, width, height, channel)

        postMessage({
          id,
          result: {
            array
          }
        })
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `process typed array error: ${e.toString()}`
          }
        })
      }
    }
    if (method === VALID_METHOD.PROCESS_TYPED_ARRAY_F2RGBA) {
      try {
        const { inputArray, width, height, channel } = param
        const buffer = self.typedArray.fortranToRGBA(inputArray, width, height, channel)

        postMessage({
          id,
          result: {
            buffer
          }
        }, [ buffer.buffer ])
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `process typed array error: ${e.toString()}`
          }
        })
      }
    }
    if (method === VALID_METHOD.PROCESS_TYPED_ARRAY_CM2RGBA) {
      try {
        const { inputArray, width, height, channel, dtype, processParams } = param
        const { buffer, min, max } = self.typedArray.cm2rgba(inputArray, width, height, channel, dtype, processParams)

        postMessage({
          id,
          result: {
            buffer,
            min,
            max,
          }
        }, [ buffer.buffer ])
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `process typed array error: ${e.toString()}`
          }
        })
      }
    }
    if (method === VALID_METHOD.PROCESS_TYPED_ARRAY_RAW) {
      try {
        const { inputArray, width, height, channel, dtype, processParams } = param
        const { outputArray, min, max } = self.typedArray.rawArray(inputArray, width, height, channel, dtype, processParams)

        postMessage({
          id,
          result: {
            outputArray,
            min,
            max,
          }
        })
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `process typed array error: ${e.toString()}`
          }
        })
      }
    }
    if (method === VALID_METHOD.FILTER_REGIONS) {
      const { regions, searchTerm } = param
      try {
        const filteredRegions = self.filterRegion.filterRegion(regions, searchTerm)
        
        postMessage({
          id,
          result: { filteredRegions }
        })
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `filter region error: ${e.toString()}`
          }
        })
      }
      
      return
    }
    postMessage({
      id,
      error: {
        code: 404,
        message: `worker method not found. ${message.data.method}`
      }
    })
    return
  }
}
