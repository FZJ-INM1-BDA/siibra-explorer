// TODO to be merged with ng viewer state after refactor
export { INgLayerInterface, PANELS } from './ngViewerState/constants'

export {
  ngViewerActionAddNgLayer,
  ngViewerActionRemoveNgLayer,
  
  ngViewerActionToggleMax,
  ngViewerActionClearView,
  ngViewerActionSetPanelOrder,
  ngViewerActionForceShowSegment,
} from './ngViewerState/actions'

export {
  ngViewerSelectorClearView,
  ngViewerSelectorClearViewEntries,
  ngViewerSelectorNehubaReady,
  ngViewerSelectorPanelOrder,
  ngViewerSelectorLayers,
} from './ngViewerState/selectors'
