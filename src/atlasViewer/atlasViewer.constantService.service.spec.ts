import { encodeNumber, decodeToNumber } from './atlasViewer.constantService.service'
import {} from 'jasmine'

const FLOAT_PRECISION = 6

describe('encodeNumber/decodeToNumber', () => {


  const getCompareOriginal = (original: number[]) => (element:string, index: number) => 
    original[index].toString().length >= element.length
  

  const lengthShortened = (original: number[], encodedString: string[]) =>
    encodedString.every(getCompareOriginal(original))

  it('should encode/decode positive integer as expected', () => {

    const positiveInt = [
      0,
      1,
      99999999999,
      12347
    ]

    const encodedString = positiveInt.map(n => encodeNumber(n))
    const decodedString = encodedString.map(s => decodeToNumber(s))
    expect(decodedString).toEqual(positiveInt)
    
    expect(lengthShortened(positiveInt, encodedString)).toBe(true)
  })

  it('should encode/decode ANY positive integer as expected', () => {
    const posInt = Array(1000).fill(null).map(() => {
      const numDig = Math.ceil(Math.random() * 7)
      return Math.floor(Math.random() * Math.pow(10, numDig))
    })
    const encodedString = posInt.map(n => encodeNumber(n))
    const decodedNumber = encodedString.map(s => decodeToNumber(s))
    expect(decodedNumber).toEqual(posInt)

    expect(lengthShortened(posInt, encodedString)).toBe(true)
  })


  it('should encode/decode signed integer as expected', () => {

    const signedInt = [
      0,
      -0,
      -1,
      1,
      128,
      -54
    ]
  
    const encodedString = signedInt.map(n => encodeNumber(n))
    const decodedNumber = encodedString.map(s => decodeToNumber(s))

    /**
     * -0 will be converted to 0 by the encode/decode process, but does not deep equal, according to jasmine
     */
    expect(decodedNumber).toEqual(signedInt.map(v => v === 0 ? 0 : v))

    expect(lengthShortened(signedInt, encodedString)).toBe(true)
  })

  it('should encode/decode ANY signed integer as expected', () => {

    const signedInt = Array(1000).fill(null).map(() => {
      const numDig = Math.ceil(Math.random() * 7)
      return Math.floor(Math.random() * Math.pow(10, numDig)) * (Math.random() > 0.5 ? 1 : -1)
    })
    const encodedString = signedInt.map(n => encodeNumber(n))
    const decodedNumber = encodedString.map(s => decodeToNumber(s))

    /**
     * -0 will be converted to 0 by the encode/decode process, but does not deep equal, according to jasmine
     */
    expect(decodedNumber).toEqual(signedInt.map(v => v === 0 ? 0 : v))

    expect(lengthShortened(signedInt, encodedString)).toBe(true)
  })


  it('should encode/decode float as expected', () => {
    const floatNum = [
      0.111,
      12.23,
      1723.0
    ]

    const encodedString = floatNum.map(f => encodeNumber(f, { float: true }))
    const decodedNumber = encodedString.map(s => decodeToNumber(s, { float: true }))
    expect(decodedNumber.map(n => n.toFixed(FLOAT_PRECISION))).toEqual(floatNum.map(n => n.toFixed(FLOAT_PRECISION)))
  })

  it('should encode/decode ANY float as expected', () => {
    const floatNums = Array(1000).fill(null).map(() => {
      const numDig = Math.ceil(Math.random() * 7)
      return (Math.random() > 0.5 ? 1 : -1) * Math.floor(
        Math.random() * Math.pow(10, numDig)
      )
    })

    const encodedString = floatNums.map(f => encodeNumber(f, { float: true }))
    const decodedNumber = encodedString.map(s => decodeToNumber(s, { float: true }))

    expect(floatNums.map(v => v.toFixed(FLOAT_PRECISION))).toEqual(decodedNumber.map(n => n.toFixed(FLOAT_PRECISION)))
  })
})