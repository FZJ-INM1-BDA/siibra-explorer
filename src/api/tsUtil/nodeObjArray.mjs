import { processNode } from "./index.mjs"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeObjArray
 * @property {number} kind
 * @property {(TSNodeObjArray|TSNodeObjTypeRef)} elementType
 */


/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeObjArray}
 */
export function isType(input){
  return input.kind === 185
}

/**
 * 
 * @param {JSchema} acc
 * @param {TSNodeObjArray} input
 * @param {Object.<string, JSchema>} defs
 * @returns {Promise<JSchema>}
 */
export async function toJsonSchema(acc, input, defs){
  return {
    type: "array",
    items: await processNode({}, input.elementType, defs)
  }
}
