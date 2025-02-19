import { InjectionToken } from "@angular/core"
import { getNehubaConfig, getParcNgId } from "./util"

export {
  NehubaConfig,
  NgConfig,
  NgConfigViewerState,
  NgLayerSpec,
  NgPrecompMeshSpec,
  NgSegLayerSpec,
} from "./type"
export {
  
  getParcNgId,
  getNehubaConfig,
  defaultNehubaConfig,
} from "./util"

export interface NehubaConfigSvc {
  getParcNgId: typeof getParcNgId
  getNehubaConfig: typeof getNehubaConfig
}

export const NEHUBA_CONFIG_SERVICE_TOKEN = new InjectionToken<NehubaConfigSvc>("NEHUBA_CONFIG_SERVICE_TOKEN")
