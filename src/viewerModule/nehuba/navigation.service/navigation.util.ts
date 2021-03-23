import { TVec3, TVec4 } from "src/messaging/types";
import { arrayOfPrimitiveEqual } from "src/util/fn";

export interface INavObj {
  position: TVec3
  orientation: TVec4
  perspectiveOrientation: TVec4
  perspectiveZoom: number
  zoom: number
}

export function navMul(nav: INavObj, scalar: number): INavObj {
  return {
    zoom: nav.zoom * scalar,
    perspectiveZoom: nav.perspectiveZoom * scalar,
    position: nav.position.map(v => v * scalar) as TVec3,
    orientation: nav.orientation.map(v => v * scalar) as TVec4,
    perspectiveOrientation: nav.perspectiveOrientation.map(v => v * scalar) as TVec4,
  }
}

export function navAdd(nav1: INavObj, nav2: INavObj): INavObj {
  return {
    zoom: nav1.zoom + nav2.zoom,
    perspectiveZoom: nav1.perspectiveZoom + nav2.perspectiveZoom,
    position: [0, 1, 2].map(idx => nav1.position[idx] + nav2.position[idx]) as [number, number, number],
    orientation: [0, 1, 2, 3].map(idx => nav1.orientation[idx] + nav2.orientation[idx]) as [number, number, number, number],
    perspectiveOrientation: [0, 1, 2, 3].map(idx => nav1.perspectiveOrientation[idx] + nav2.perspectiveOrientation[idx]) as [number, number, number, number],
  }
}

export function navObjEqual(nav1: INavObj, nav2: INavObj): boolean{
  if (nav1 === nav2) return true
  if (!nav1) return false
  if (!nav2) return false
  
  const keys = ["orientation", "perspectiveOrientation", "perspectiveZoom", "position", "zoom"]
  let flag: boolean = true
  for (const key of keys) {
    if (typeof nav1[key] !== typeof nav2[key]) {
      flag = false
      break
    }
    if (typeof nav1[key] === 'number') {
      if (Math.round(nav1[key]) !== Math.round(nav2[key])) {
        flag = false
        break
      }
    } else {
      const _flag = arrayOfPrimitiveEqual(nav1[key], nav2[key])
      if (!_flag) {
        flag = false
        break
      }
    }
  }
  return flag
}