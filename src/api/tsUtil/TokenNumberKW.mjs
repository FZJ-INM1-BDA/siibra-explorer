import { processNode } from "./index.mjs"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TokenStringKW
 * @property {number} kind
 * @property {TSIdObj} name
 * @property {(TSNodeObjArray|TSNodeObjTypeRef)} type
 */

/**
 * 
 * @param {*} input 
 * @returns {input is TokenStringKW}
 */
export function isType(input){
  return input.kind === 148
}

/**
 * 
 * @param {JSchema} acc
 * @param {TokenStringKW} input
 * @param {Object.<string, JSchema>} defs
 * @returns {Promise<JSchema>}
 */
export async function toJsonSchema(acc, input, defs){
  return {
    type: "number"
  }
}
