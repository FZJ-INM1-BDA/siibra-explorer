(() => {
  if (!export_nehuba) {
    console.warn(`export_nehuba is not defined. Did you forget to import vanilla nehuba?`)
    return
  }
  const paramsString = window.location.search;
  const searchParams = new URLSearchParams(paramsString);
  const keys = [
    "zoomWithoutCtrl",
    "rightClickWithCtrl",
    "zoomAtViewCentre",
  ]
  const config = {}
  for (const key of keys){
    if (searchParams.has(key)) {
      config[key] = true
    }
  }

  // why geese? have you seen how many geese there are in FZJ?
  if (searchParams.has("geese")) {
    config["zoomWithoutCtrl"] = true
    config["zoomAtViewCentre"] = true
  }
  window.nehubaViewer = export_nehuba.createUrlHashedNehubaViewer(config, err => console.error(err))
})()