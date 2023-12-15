/**
 * @typedef {import("./index.mjs").JSchema} JSchema
 */

/**
 * @typedef {Object} TSNodeObjTypeRef
 * @property {number} kind
 * @property {TSIdObj} typeName
 */


/**
 * 
 * @param {*} input 
 * @returns {input is TSNodeObjTypeRef}
 */
export function isType(input){
  return input.kind === 180
}

/**
 * 
 * @param {JSchema} acc
 * @param {TSNodeObjTypeRef} input
 * @param {Object.<string, JSchema>} defs
 * @returns {Promise<JSchema>}
 */
export async function toJsonSchema(acc, input, defs){
  return {
    $ref: `#/definitions/${input.typeName.text}`
  }
}
