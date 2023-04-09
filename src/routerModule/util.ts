import { UrlSegment, UrlTree } from "@angular/router"
import { Component } from "@angular/core"

export const encodeId = (id: string) => id && id.replace(/\//g, ':')
export const decodeId = (codedId: string) => codedId && codedId.replace(/:/g, '/')

export const encodePath = (key: string, val: string|string[]) =>
  key[0] === '?'
    ? `?${key}=${val}`
    : `${key}:${Array.isArray(val)
      ? val.map(v => encodeURI(v)).join('::')
      : encodeURI(val)}`

export const decodePath = (path: string) => {
  const re = /^(.*?):(.*?)$/.exec(path)
  if (!re) return null
  return {
    key: re[1],
    val: re[2].split('::').map(v => decodeURI(v))
  }
}

export const DEFAULT_NAV = {
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [
    0.3140767216682434,
    -0.7418519854545593,
    0.4988985061645508,
    -0.3195493221282959
  ],
  position: [0, 0, 0],
}

export const verifyCustomState = (key: string) => {
  return /^x-/.test(key)
}

export const decodeCustomState = (fullPath: UrlTree) => {
  const returnObj: Record<string, string> = {}
  
  const pathFragments: UrlSegment[] = fullPath.root.hasChildren()
    ? fullPath.root.children['primary'].segments
    : []
  
  for (const f of pathFragments) {
    if (!verifyCustomState(f.path)) continue
    const { key, val } = decodePath(f.path) || {}
    if (!key || !val) continue
    returnObj[key] = val[0].replace("%2F", '/')
  }
  return returnObj
}

export const encodeCustomState = (key: string, value: string|string[]) => {
  if (!verifyCustomState(key)) {
    throw new Error(`custom state must start with x-`)
  }
  if (!value) return null
  return encodePath(key, value).replace(/\//g, '%2F')
}

@Component({
  template: ''
})
export class DummyCmp{}

export const routes = [{
  path: '**',
  component: DummyCmp
}]
