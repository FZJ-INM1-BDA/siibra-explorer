import { annotation, atlasAppearance, atlasSelection, plugins, userInteraction, userInterface, userPreference } from "."

export const nameSpace = `[state]`

export type MainState = {
  [userPreference.nameSpace]: userPreference.UserPreference
  [atlasSelection.nameSpace]: atlasSelection.AtlasSelectionState
  [userInterface.nameSpace]: userInterface.UiStore
  [userInteraction.nameSpace]: userInteraction.UserInteraction
  [annotation.nameSpace]: annotation.AnnotationState
  [plugins.nameSpace]: plugins.PluginStore
  [atlasAppearance.nameSpace]: atlasAppearance.AtlasAppearanceStore
}
