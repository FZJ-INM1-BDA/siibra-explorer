(() => {
  if (!export_nehuba) {
    console.warn(`export_nehuba is not defined. Did you forget to import vanilla nehuba?`)
    return
  }
  export_nehuba.createNehubaViewer({}, err => console.error(err))
})()