import ts from "typescript"
import { readdir, mkdir, unlink } from "node:fs/promises"
import path, { dirname } from 'path'
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "url"

const WARNINGTXT = `<!-- DO NOT UPDATE THIS AND BELOW: UPDATED BY SCRIPT -->`

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * @typedef {import("./tsUtil/index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSIdObj
 * @property {string} text
 */

/**
 * @typedef {Object} TSNodeObjTypeAliasDec
 * @property {number} kind
 * @property {TSNodeObjTypeLiteral} type
 */


/**
 * @typedef {Object} TSNodeObjTypeLiteral
 * @property {number} kind
 * @property {Array.<TSNodeObjPropSig>} members
 */


/**
 * 
 * @param {string} pathToDir 
 */
export async function clearDirectory(pathToDir){
  await mkdir(pathToDir, {
    recursive: true
  })
  const files = await readdir(pathToDir)
  for (const f of files) {
    /**
     * only remove json files
     */
    if (f.endsWith(".json")) {
      await unlink(path.join(pathToDir, f))
    }
  }
}


/**
 * 
 * @param {string} pathToDir 
 */
export async function populateReadme(pathToDir){

  /**
   * @type {string}
   */
  const text = await readFile(`${pathToDir}/README.md`, 'utf-8')

  /**
   * @type {Array.<string>}
   */
  const newText = []

  const lines = text.split("\n")
  for (const line of lines) {
    newText.push(line)
    if (line.startsWith(WARNINGTXT)) {
      break
    }
  }

  newText.push("")

  const files = await readdir(pathToDir)

  /**
   * @typedef {Object} EventObj
   * @property {'viewer'|'client'} initiator
   * @property {string} requestFile
   * @property {string} responseFile
   */

  /**
   * @type {Object.<string, EventObj>}
   */
  const events = {}
  
  for (const f of files) {
    /**
     * only remove json files
     */
    if (f.endsWith(".json")) {
      const [ evName, fromTo, reqResp ] = f.replace(/\.json$/, "").split("__")
      if (['fromSxplr', 'toSxplr'].indexOf(fromTo) < 0) {
        throw Error(`Expected ${fromTo} to be either 'fromSxplr' or 'toSxplr', but was neither`)
      }
      let initiator
      if (fromTo === "fromSxplr") {
        initiator = "viewer"
      }
      if (fromTo === "toSxplr") {
        initiator = "client"
      }
      if (['request', 'response'].indexOf(reqResp) < 0) {
        throw new Error(`Expected ${reqResp} to be either 'request' or 'response', but was neither`)
      }

      /**
       * @type {Object}
       * @property {string} requestFile
       * @property {string} responseFile
       */
      const reqRespObj = {}
      if (reqResp === "request") {
        reqRespObj.requestFile = f
      }
      if (reqResp === "response") {
        reqRespObj.responseFile = f
      }
      if (!events[evName]) {
        events[evName] = {
          initiator,
        }
      }
      events[evName] = {
        ...events[evName],
        ...reqRespObj,
      }
      
    }
  }


  function linkMd(file){
    if (!file) {
      return ``
    }
    return `[jsonschema](${file})`
  }

  newText.push(
    `| event name | initiator | request | response |`,
    `| --- | --- | --- | --- |`,
    ...Object.entries(events).map(
      ([ evName, { initiator, requestFile, responseFile }]) => `| ${evName} | ${initiator} | ${linkMd(requestFile)} | ${linkMd(responseFile)} |`
    ),
    ``
  )

  await writeFile(`${pathToDir}/README.md`, newText.join("\n"), "utf8")
}

/**
 * 
 * @param {Object|Array|string} input 
 * @returns {Array.<string>}
 */
export function getAllDefs(input){
  if (typeof input === "string") {
    if (input.startsWith("#/")){
      return [input]
    }
    return []
  }
  if (Array.isArray(input)) {
    return input.map(getAllDefs).flatMap(v => v)
  }
  if (input === null) {
    return []
  }
  if (typeof input === "object") {
    return Object.keys(input).map(key => getAllDefs(input[key])).flatMap(v => v)
  }
  if (typeof input === "number") {
    return []
  }
  throw new Error(`cannot deal with type ${typeof input}`)
}

/**
 * 
 * @param {Object} d 
 * @param {string} key
 * @param {*} value
 */
function setDictValue(d, key, value){
  let iter = d
  const keys = key.replace(/^#\//, '').split("/")
  for (const key of keys){
    if (!iter[key]) {
      iter[key] = {}
    }
    if (keys.at(-1) === key) {
      iter[key] = value
    } else {
      iter = iter[key]
    }
  }
}

/**
 * 
 * @description Get the value (if exist), otherwise return null. Does not mutate
 * @param {Object} d 
 * @param {string} key 
 * @returns {JSchema|null}
 */
function getDictValue(d, key) {
  const keys = key.replace(/^#\//, '').split("/")
  let returnValue = d
  for (const key of keys){
    if (!returnValue) {
      return null
    }
    returnValue = returnValue[key]
  }
  return returnValue
}

/**
 * @type {Object.<string, {"definitions": Object<string, JSchema>}>}
 */
const defMap = {
  "#/definitions/AddableLayer": {
    definitions: {
      len4num: {
        type: "array",
        items: {
          type: "number"
        },
        minItems: 4,
        maxItems: 4
      },
      AddableLayer: {
        type: "object",
        properties: {
          source: {
            type: "string"
          },
          shader: {
            type: "string"
          },
          transform: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              $ref: "#/definitions/len4num"
            }
          }
        }
      }
    }
  },
  "#/definitions/SxplrCoordinatePointExtension": {
    definitions: {
      SxplrCoordinatePointExtension: {
        allOf: [{
          $ref: "#/definitions/AtId"
        }, {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            color: {
              type: "string"
            },
            openminds: {
              $ref: "#/components/schemas/CoordinatePointModel"
            }
          }
        }]
      },
      AtId: {
        type: "object",
        properties: {
          "@id": {
            type: "string"
          }
        }
      }
    }
  },
  "#/definitions/AtId": {
    definitions: {
      AtId: {
        type: "object",
        properties: {
          "@id": {
            type: "string"
          }
        }
      }
    }
  },
  "#/definitions/Point": {
    definitions: {
      Point: {
        type: "object",
        properties: {
          loc: {
            type: "array",
            items: {
              type: "number"
            },
            minItems: 3,
            maxItems: 3
          },
          space: {
            type: "object",
            properties: {
              id: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  "#/definitions/MainState__[state.atlasSelection]__navigation": {
    definitions: {
      len3num: {
        type: "array",
        items: {
          type: "number"
        },
        minItems: 3,
        maxItems: 3
      },
      len4num: {
        type: "array",
        items: {
          type: "number"
        },
        minItems: 4,
        maxItems: 4
      },
      "MainState__[state.atlasSelection]__navigation": {
        type: "object",
        properties: {
          position: {
            $ref: "#/definitions/len3num"
          },
          orientation: {
            $ref: "#/definitions/len4num"
          },
          zoom: {
            type: "number"
          },
          perspectiveOrientation: {
            $ref: "#/definitions/len4num"
          },
          perspectiveZoom: {
            type: "number"
          }
        }
      }
    }
  },
  "#/definitions/JRPCRequest": {
    definitions: {
      JRPCRequest: {
        type: "object",
        properties: {
          id: {
            type: "string"
          }
        }
      }
    }
  }
}

let openApi = null

/**
 * 
 * @param {string} def
 * @param {ts.SourceFile} src
 * @returns {Promise<Object<string, Object<string, JSchema>>>}
 */
export async function resolveDef(def, src){
  
  /**
   * @type {JSchema}
   */
  let schema = null

  const fullDef = def
  const trimmedDef = def.replace("#/definitions/", "")
  const found = defMap[def]
  if(found) {
    schema = found
    
    if (trimmedDef === "AtId" || trimmedDef === "AddableLayer") {
      return schema
    }
  }
  if (!openApi) {
    const openapiText = await readFile(path.resolve(__dirname, "../atlasComponents/sapi/openapi.json"), "utf-8")
    openApi = JSON.parse(openapiText)
  }

  
  /**
   * 
   * @param {string} refStr 
   * @returns {JSchema}
   */
  function getRef(refStr){
    const trimmedRef = refStr.replace(/^#\//, "")
    let traversal = openApi
    for (const key of trimmedRef.split("/")) {
      traversal = traversal[key]
      if (!traversal) {
        debugger
        throw new Error(`Path ${refStr} cannot be found`)
      }
    }
    return JSON.parse(JSON.stringify(traversal))
  }

  src.forEachChild(n => {
    if (ts.SyntaxKind[n.kind] === "TypeAliasDeclaration") {
      if (n.name.text === trimmedDef) {
        if (ts.SyntaxKind[n.type.kind] !== 'TypeReference') {
          throw new Error(`definition resolution must either be defined in the map, or of typereferece, but it is ${n.type.kind} ${ts.SyntaxKind[n.type.kind]}`)
        }
        if (n.type.typeName.text !== "PathReturn") {
          throw new Error(`definition resolution typereference must be of typename pathreturn`)
        }
        /**
         * @type {Array.<{literal: {text: string}}>}
         */
        const typeArg = n.type.typeArguments
        if (typeArg.length !== 1) {
          throw new Error(`Expecting one and only one typeArguments`)
        }
        const foundPath = openApi['paths'][typeArg[0].literal?.text]
        if (!foundPath) {
          console.error(typeArg[0])
          throw new Error(`path not found`)
        }
        const ref = foundPath['get']['responses']['200']['content']['application/json']['schema']['$ref']
        if (!!schema) {
          throw new Error(`schema is already defined!`)
        }
        schema = {}
        setDictValue(schema, fullDef, getRef(ref))
      }
    }
  })

  if (!schema) {
    throw new Error(`Schema not found!`)
  }

  let allDefs = getAllDefs(schema)
  // ensure the defs are not yet defined
  allDefs = allDefs.filter(def => !getDictValue(schema, def))

  let cb = 0
  while (true) {
    if (allDefs.length === 0) {
      break
    }
    cb ++
    if (cb > 100) {
      throw new Error(`cb reached 100`)
    }

    const def = allDefs.shift()
    const ref = getRef(def)
    setDictValue(schema, def, ref)

    const newDefs = getAllDefs(ref)
    for (const def of newDefs) {
      if (!getDictValue(schema, def)) {
        allDefs.push(def)
      }
    }
  }

  return schema
}


/**
 * 
 * @param {JSchema} schema 
 * @param {ts.Node} node 
 */
export async function resolveAllDefs(schema, node){

  /**
   * @type {JSchema}
   */
  let newSchema = schema
  const allDefs = getAllDefs(newSchema)
  for (const def of allDefs) {
    const resolvedDefs = await resolveDef(def, node)
    newSchema = {
      ...newSchema,
      ...resolvedDefs
    }
  }
  return newSchema
}