import { processNode } from "./index.mjs"
import ts from "typescript"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeIndexAccess
 * @property {number} kind
 * @property {TSIdObj} objectType
 * @property {TSIdObj} indexType
 */


/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeIndexAccess}
 */
export function isType(input){
    return input.kind === 196
  }
  
  /**
   * 
   * @param {JSchema} acc
   * @param {TSNodeIndexAccess} input
   * @param {Object.<string, JSchema>} defs
   * @returns {Promise<JSchema>}
   */
  export async function toJsonSchema(acc, input, defs){
    const processedObj = await processNode({}, input.objectType, defs)
    if (!processedObj.$ref) {
      throw new Error(`Prorcessing index access type error. objtype must be $ref`)
    }
    const index = await processNode({}, input.indexType, defs)
    if (!index.const) {
      throw new Error(`Prorcessing index access type error. indextype must be const`)
    }

    /**
     * @type {string}
     */
    const ref = processedObj.$ref
    return {
      $ref: `#/definitions/${ref.replace(/^#\/definitions\//, '')}__${index.const}`
    }
  }
  