import { processNode } from "./index.mjs"
import ts from "typescript"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeTypeLiteral
 * @property {number} kind
 * @property {Array.<ts.Node>} members
 */


/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeTypeLiteral}
 */
export function isType(input){
    return input.kind === 184
  }
  
  /**
   * 
   * @param {JSchema} acc
   * @param {TSNodeTypeLiteral} input
   * @param {Object.<string, JSchema>} defs
   * @returns {Promise<JSchema>}
   */
  export async function toJsonSchema(acc, input, defs){
    /**
     * @type {JSchema}
     */
    let returnVal = {}
    for (const mem of input.members) {
      returnVal = await processNode(returnVal, mem, defs)
    }
    return returnVal
  }
  