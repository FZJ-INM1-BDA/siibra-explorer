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

const cipher = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'
export const separator = "."
const negString = '~'

const encodeInt = (number: number) => {
  if (number % 1 !== 0) { throw new Error('cannot encodeInt on a float. Ensure float flag is set') }
  if (isNaN(Number(number)) || number === null || number === Number.POSITIVE_INFINITY) { throw new Error('The input is not valid') }

  let residual: number
  let result = ''

  if (number < 0) {
    result += negString
    residual = Math.floor(number * -1)
  } else {
    residual = Math.floor(number)
  }

  /* eslint-disable-next-line no-constant-condition */
  while (true) {
    result = cipher.charAt(residual % 64) + result
    residual = Math.floor(residual / 64)

    if (residual === 0) {
      break
    }
  }
  return result
}

interface IB64EncodingOption {
  float: boolean
}

const defaultB64EncodingOption = {
  float: false,
}

export const encodeNumber:
  (number: number, option?: IB64EncodingOption) => string =
  (number: number, { float = false }: IB64EncodingOption = defaultB64EncodingOption) => {
    if (!float) { return encodeInt(number) } else {
      const floatArray = new Float32Array(1)
      floatArray[0] = number
      const intArray = new Uint32Array(floatArray.buffer)
      const castedInt = intArray[0]
      return encodeInt(castedInt)
    }
  }

const decodetoInt = (encodedString: string) => {
  let _encodedString
  let negFlag = false
  if (encodedString.slice(-1) === negString) {
    negFlag = true
    _encodedString = encodedString.slice(0, -1)
  } else {
    _encodedString = encodedString
  }
  return (negFlag ? -1 : 1) * [..._encodedString].reduce((acc, curr) => {
    const index = cipher.indexOf(curr)
    if (index < 0) { throw new Error(`Poisoned b64 encoding ${encodedString}`) }
    return acc * 64 + index
  }, 0)
}

export const decodeToNumber:
  (encodedString: string, option?: IB64EncodingOption) => number =
  (encodedString: string, {float = false} = defaultB64EncodingOption) => {
    if (!float) { return decodetoInt(encodedString) } else {
      const _int = decodetoInt(encodedString)
      const intArray = new Uint32Array(1)
      intArray[0] = _int
      const castedFloat = new Float32Array(intArray.buffer)
      return castedFloat[0]
    }
  }

/**
 * see https://stackoverflow.com/questions/53051415/can-you-disable-auxiliary-secondary-routes-in-angular
 * need to encode brackets
 */
export const encodeURIFull = (str: string) => {
  return encodeURI(str).replace(/[()]/g, s => `%${s.charCodeAt(0).toString(16)}`)
}
