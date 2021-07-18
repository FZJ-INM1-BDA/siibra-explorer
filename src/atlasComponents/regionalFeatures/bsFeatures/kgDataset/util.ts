import { TBSDetail, TCountedDataModality } from "./type";

export function filterKgFeatureByModailty(modalities: TCountedDataModality[]){
  const visibleModNames = modalities
    .filter(mod => mod.visible)
    .map(mod => mod.name)
  const visibleModNameSet = new Set(visibleModNames)
  return function(feature: TBSDetail){
    if (modalities.every(m => !m.visible)) return true
    return feature.__detail.methods.some(m => visibleModNameSet.has(m))
  }
}
