/**
 * First attempt at encoding int (e.g. selected region, navigation location) from number (loc info density) to b64 (higher info density)
 * The constraint is that the cipher needs to be commpatible with URI encoding
 * and a URI compatible separator is required.
 *
 * While a faster solution exist in the same post, this operation is expected to be done:
 * - once per 1 sec frequency
 * - on < 1000 numbers
 *
 * So performance is not really that important (Also, need to learn bitwise operation)
 */


import { sxplrNumB64Enc } from "common/util"
const {
  separator,
  cipher,
  encodeNumber,
  decodeToNumber,
} = sxplrNumB64Enc

export {
  separator,
  cipher,
  encodeNumber,
  decodeToNumber,
}

/**
 * see https://stackoverflow.com/questions/53051415/can-you-disable-auxiliary-secondary-routes-in-angular
 * need to encode brackets
 */
export const encodeURIFull = (str: string) => {
  return encodeURI(str).replace(/[()]/g, s => `%${s.charCodeAt(0).toString(16)}`)
}
