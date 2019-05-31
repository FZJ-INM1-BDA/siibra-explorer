export function regionFlattener(region:any){
  return[
    [ region ],
    ...((region.children && region.children.map && region.children.map(regionFlattener)) || [])
  ].reduce((acc, item) => acc.concat(item), [])
}