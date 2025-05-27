import ts from "typescript"
import * as nodeObjArray from "./nodeObjArray.mjs"
import * as nodeObjPropSig from "./nodeObjPropSig.mjs"
import * as nodeObjTypeRef from "./nodeObjTypeRef.mjs"
import * as nodeObjIndexAccessType from "./nodeObjIndexAccessType.mjs"
import * as nodeObjLiteralType from "./nodeObjLiteralType.mjs"
import * as nodeObjTypeLiteral from "./nodeObjTypeLiteral.mjs"
import * as TokenStringKW from "./TokenStringKW.mjs"
import * as TokenBooleanKW from "./TokenBooleanKW.mjs"
import * as TokenNumberKW from "./TokenNumberKW.mjs"
import * as nodeObjIntersectionType from "./nodeObjIntersectionType.mjs"
import * as nodeObjUnionType from "./nodeObjUnionType.mjs"


/**
 * @typedef {Object} JSPrimitives
 * @property {('number'|'string'|'boolean'|'null')} type
 * 
 * @typedef {Object} JSConst
 * @property {number|string|boolean|null} const
 * 
 * @typedef {Object} JSObj
 * @property {'object'} type
 * @property {Object.<string, JSchema>} properties
 * 
 * @typedef {Object} JSArray
 * @property {'array'} type
 * @property {JSchema} items
 * @property {number} minItems
 * @property {number} maxItems
 * 
 * @typedef {Object} JSRef
 * @property {string} $ref
 * 
 * @typedef {Object} JSAny
 * @property {Array.<JSchema>} anyOf
 * 
 * @typedef {Object} JSAll
 * @property {Array.<JSchema>} allOf
 * 
 * 
 * @typedef {(JSPrimitives|JSConst|JSObj|JSArray|JSRef|JSAny|JSAll)} JSchema
 */

/**
 * 
 * @param {JSchema} acc 
 * @param {*} input 
 * @param {Object.<string, JSchema>} defs
 * @returns {Promise<JSchema>}
 */
export async function processNode(acc, input, defs){
  for (const { isType, toJsonSchema } of [
    nodeObjArray,
    nodeObjPropSig,
    nodeObjTypeRef,
    nodeObjIndexAccessType,
    nodeObjLiteralType,
    nodeObjTypeLiteral,
    TokenStringKW,
    TokenBooleanKW,
    TokenNumberKW,
    nodeObjIntersectionType,
    nodeObjUnionType,
  ]) {
    if (isType(input)) {
      return await toJsonSchema(acc, input, defs)
    }
  }
  debugger
  throw new Error(`input cannot be processed properly ${input.kind} ${ts.SyntaxKind[input.kind]}`)
}
