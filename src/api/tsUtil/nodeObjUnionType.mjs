import { processNode } from "./index.mjs"
import ts from "typescript"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeUnionType
 * @property {number} kind
 * @property {Array.<ts.Node>} types
 */


/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeUnionType}
 */
export function isType(input){
    return input.kind === 189
  }
  
  /**
   * 
   * @param {JSchema} acc
   * @param {TSNodeUnionType} input
   * @param {Object.<string, JSchema>} defs
   * @returns {Promise<JSchema>}
   */
  export async function toJsonSchema(acc, input, defs){
    return {
      anyOf: await Promise.all(
        input.types.map(type => processNode({}, type, defs))
      )
    }
  }
  