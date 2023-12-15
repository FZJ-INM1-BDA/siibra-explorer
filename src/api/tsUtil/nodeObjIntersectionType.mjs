import { processNode } from "./index.mjs"
import ts from "typescript"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeIntersectionType
 * @property {number} kind
 * @property {Array.<ts.Node>} types
 */


/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeIntersectionType}
 */
export function isType(input){
    return input.kind === 190
  }
  
  /**
   * 
   * @param {JSchema} acc
   * @param {TSNodeIntersectionType} input
   * @param {Object.<string, JSchema>} defs
   * @returns {Promise<JSchema>}
   */
  export async function toJsonSchema(acc, input, defs){
    return {
      allOf: await Promise.all(
        input.types.map(type => processNode({}, type, defs))
      )
    }
  }
  