# URL parsing

!!! note
    Since [version 2.0.0](../releases/v2.0.0.md), navigation state and region(s) selected has been significantly redesigned.

    While the the URL parsing engine should still be backwards compatible, users should update their bookmarks/links. 

The interactive atlas viewer uses query parameters to store some of the viewer state. As a result, users can share or bookmark the URL, easily collaborating with other users in an interactive environment.


```
https://interactive-viewer.apps.hbp.eu/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps&cRegionsSelected=%7B%22interpolated%22%3A%224.5.6.7.O.P%22%7D&cNavigation=0.0.0.-W000..-J0_A.2_4alZ._DTi1.2-3oKv..7LIx..jFlG~.Efml~.M7am..10c2
```

However, expert users may want to generate custom state URLs. 

This document explains how the URL parsing in the Interactive Atlas Viewer work.

## Query Parameters

| Query param | 
| --- | 
| [`templateSelected`](#templateselected) | 
| [`parcellationSelected`](#parcellationselected) |
| [`cNavigation`](#cnavigation) | 
| [`cRegionsSelected`](#cregionsselected) | 

### `templateSelected`

Describes the selected template. URI encoded value of the name of the selected template.

If unset, loads homepage.

__Example__

```
templateSelected=Big+Brain+%28Histology%29
```


### `parcellationSelected`

Describes the parcellation selected. Depends on `templateSelected`. URI encoded value of the name of the selected parcellation.

If unset, or not a subset of parcellations supported by the selected template, the first parcellation of the selected template will be loaded instead

__Example__

```
parcellationSelected=Cytoarchitectonic+Maps
```

### `cNavigation`

Describes the navigation state of the viewer.

Uses `..` as a delimiter for key value, `.` as a delimiter for value and [hash function](#hash-function) to encode signed float to base64 string.

If unset, loads the default orientation.

__Example__

```
cNavigation=0.0.0.-W000..-J0_A.2_4alZ._DTi1.2-3oKv..7LIx..jFlG~.Efml~.M7am..10c2
```

```javascript
// cNavigation=0.0.0.-W000..-J0_A.2_4alZ._DTi1.2-3oKv..7LIx..jFlG~.Efml~.M7am..10c2

const cNavigation = `0.0.0.-W000..-J0_A.2_4alZ._DTi1.2-3oKv..7LIx..jFlG~.Efml~.M7am..10c2`

// First, separate with key value delimiter
const [
  orientationStr,
  perspectiveOrientationStr,
  perspectiveZoomStr,
  positionStr,
  zoomStr  
] = cNavigation.split('..')

// For entries that are Array:

const orientationArr = orientationStr.split('.')
const perspectiveOrientationArr = perspectiveOrientationStr.split('.')
const positionArr = positionStr.split('.')


// check hash function for decodeToNumber
// To get values back:
const orientation = orientationArr.map(v => decodeToNumber(v, { float: true }))
// [ 0, 0, 0, 1 ]


const perspectiveOrientation = perspectiveOrientationArr.map(v => decodeToNumber(v, { float: true }))
// [ 0.7971121072769165,  -0.14286760985851288,  0.17759324610233307,  -0.5591617226600647 ]

const zoom = decodeToNumber(zoomStr, { float: false })
// 264578

const perspectiveZoom = decodeToNumber(perspectiveZoomStr, { float: false })
// 1922235

const position = positionArr.map(v => decodeToNumber(v, { float: false }))
// [ -11860944, -3841071, 5798192 ]

```


### `cRegionsSelected`

Describe the regions selected.

Query value is an URI encoded JSON object. Upon decoding, keys represent the name of the segmentation layer (which is often different to _selected parcellation_). Value is a `.` delimited array of integer [hashed](#hash-function) to base64 string.

If unset, or if unable to decode, does not select region.

__Example__

```
cRegionsSelected=%7B%22interpolated%22%3A%224.5.6.7.O.P%22%7D
```

```javascript
const cRegionSelected = `%7B%22interpolated%22%3A%224.5.6.7.O.P%22%7D`
const decoded = decodeURIComponent(cRegionSelected)

const parsed = JSON.parse(decoded)
const returnObj = {}
for (const key in parsed){
  const seg = parsed[key].split('.').map(v => decodeToNumber(v, { float: false }))
  returnObj[key] = seg
}

// { interpolated: [ 4, 5, 6, 7, 24, 25 ] }

```

## hash function

```javascript

/**
 * First attempt at encoding int (e.g. selected region, navigation location) from number (loc info density) to b64 (higher info density)
 * The constraint is that the cipher needs to be commpatible with URI encoding
 * and a URI compatible separator is required. 
 * 
 * The implementation below came from 
 * https://stackoverflow.com/a/6573119/6059235
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

const encodeInt = number => {
  if (number % 1 !== 0) throw 'cannot encodeInt on a float. Ensure float flag is set'
  if (isNaN(Number(number)) || number === null || number === Number.POSITIVE_INFINITY) throw 'The input is not valid'

  let rixit // like 'digit', only in some non-decimal radix 
  let residual
  let result = ''

  if (number < 0) {
    result += negString
    residual = Math.floor(number * -1)
  } else {
    residual = Math.floor(number)
  }

  while (true) {
    rixit = residual % 64
    // console.log("rixit : " + rixit)
    // console.log("result before : " + result)
    result = cipher.charAt(rixit) + result
    // console.log("result after : " + result)
    // console.log("residual before : " + residual)
    residual = Math.floor(residual / 64)
    // console.log("residual after : " + residual)

    if (residual == 0)
      break;
    }
  return result
}

const defaultB64EncodingOption = {
  float: false
}

export const encodeNumber = (number, option = defaultB64EncodingOption) => {
  if (!float) return encodeInt(number)
  else {
    const floatArray = new Float32Array(1)
    floatArray[0] = number
    const intArray = new Uint32Array(floatArray.buffer)
    const castedInt = intArray[0]
    return encodeInt(castedInt)
  }
}

const decodetoInt = encodedString => {
  let _encodedString, negFlag = false
  if (encodedString.slice(-1) === negString) {
    negFlag = true
    _encodedString = encodedString.slice(0, -1)
  } else {
    _encodedString = encodedString
  }
  return (negFlag ? -1 : 1) * [..._encodedString].reduce((acc,curr) => {
    const index = cipher.indexOf(curr)
    if (index < 0) throw new Error(`Poisoned b64 encoding ${encodedString}`)
    return acc * 64 + index
  }, 0)
}

export const decodeToNumber = (encodedString, {float = false} = defaultB64EncodingOption) => {
  if (!float) return decodetoInt(encodedString)
  else {
    const _int = decodetoInt(encodedString)
    const intArray = new Uint32Array(1)
    intArray[0] = _int
    const castedFloat = new Float32Array(intArray.buffer)
    return castedFloat[0]
  }
}

```
