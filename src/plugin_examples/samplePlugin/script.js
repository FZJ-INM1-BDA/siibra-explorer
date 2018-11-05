/**
 * use IIEF to avoid scope poisoning
 */
(() => {
  const PLUGIN_NAME = 'fzj.xg.samplePlugin'
  const initState = window.interactiveViewer.pluginControl[PLUGIN_NAME].initState
  const initUrl = window.interactiveViewer.pluginControl[PLUGIN_NAME].initStateUrl
  console.log(initState, initUrl)
})()