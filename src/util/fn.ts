export function isSame(o, n) {
  if (!o) { return !n }
  return o === n || (o && n && o.name === n.name)
}

export function getViewer() {
  return (window as any).viewer
}

export function setViewer(viewer) {
  (window as any).viewer = viewer
}

export function setNehubaViewer(nehubaViewer) {
  (window as any).nehubaViewer = nehubaViewer
}

export function getDebug() {
  return (window as any).__DEBUG__
}

export function getExportNehuba() {
  return (window as any).export_nehuba
}

export function getNgIds(regions: any[]): string[] {
  return regions && regions.map
    ? regions
      .map(r => [r.ngId, ...getNgIds(r.children)])
      .reduce((acc, item) => acc.concat(item), [])
      .filter(ngId => !!ngId)
    : []
}
