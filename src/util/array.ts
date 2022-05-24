const defaultCmFn = <T>(o: T, n: T) => o === n
export function arrayEqual<T>(compareFn: (o1: T, o2: T) => boolean = defaultCmFn, order = false) {
  return function(array1: T[], array2: T[]){
    if (order) {
      for (const idx in array1) {
        if (!compareFn(array1[idx], array2[idx])) return false
      }
      return true
    }
    return !!array1.every(it1 => array2.find(it2 => compareFn(it1, it2)))
      && !!array2.every(it2 => array1.find(it1 => compareFn(it1, it2)))
  }
}
