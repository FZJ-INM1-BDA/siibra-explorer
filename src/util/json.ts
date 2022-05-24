import { arrayEqual } from "./array"

const defaultCmFn = <T>(o: T, n: T) => o === n
export function jsonEqual<T>(compareFn: (o1: T, o2: T) => boolean = defaultCmFn) {
  
  return function(obj1: Record<string, T>, obj2: Record<string, T>){

    /**
     * first check if keys equal
     */
    if (!arrayEqual()(Object.keys(obj1), Object.keys(obj2))) {
      return false
    }
    for (const key in obj1) {
      if (!compareFn(obj1[key], obj2[key])) return false
    }
    return true
  }
}
