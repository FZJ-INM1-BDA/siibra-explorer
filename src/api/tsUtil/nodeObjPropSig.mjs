import { processNode } from "./index.mjs"

/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeObjPropSig
 * @property {number} kind
 * @property {TSIdObj} name
 * @property {(TSNodeObjArray|TSNodeObjTypeRef)} type
 */

/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeObjPropSig}
 */
export function isType(input){
  return input.kind === 168
}

/**
 * 
 * @param {JSchema} acc
 * @param {TSNodeObjPropSig} input
 * @param {Object.<string, JSchema>} defs
 * @returns {Promise<JSchema>}
 */
export async function toJsonSchema(acc, input, defs){
  return {
    ...acc,
    properties: {
      ...acc.properties,
      [input.name.text]: await processNode({}, input.type, defs)
    },
    type: "object"
  }
}
