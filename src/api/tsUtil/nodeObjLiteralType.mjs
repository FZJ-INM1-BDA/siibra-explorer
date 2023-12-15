import { processNode } from "./index.mjs"
import ts from "typescript"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeLiteralType
 * @property {number} kind
 * @property {{text: string}} literal
 */


/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeLiteralType}
 */
export function isType(input){
    return input.kind === 198
  }
  
  /**
   * 
   * @param {JSchema} acc
   * @param {TSNodeLiteralType} input
   * @param {Object.<string, JSchema>} defs
   * @returns {Promise<JSchema>}
   */
  export async function toJsonSchema(acc, input, defs){
    if (input.literal.kind === 104) {
      return {
        const: null
      }
    }
    return {
      const: input.literal.text
    }
  }
  