import { processNode } from "./index.mjs"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TokenBoolKW
 * @property {number} kind
 * @property {TSIdObj} name
 * @property {(TSNodeObjArray|TSNodeObjTypeRef)} type
 */

/**
 * 
 * @param {*} input 
 * @returns {input is TokenBoolKW}
 */
export function isType(input){
  return input.kind === 134
}

/**
 * 
 * @param {JSchema} acc
 * @param {TokenBoolKW} input
 * @param {Object.<string, JSchema>} defs
 * @returns {Promise<JSchema>}
 */
export async function toJsonSchema(acc, input, defs){
  return {
    type: "boolean"
  }
}
