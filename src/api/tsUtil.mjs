import ts from "typescript"
import { readdir, mkdir, unlink } from "node:fs/promises"
import path, { dirname } from 'path'
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "url"

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