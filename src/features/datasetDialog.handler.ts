import { Injectable } from "@angular/core"
import { ListDirective } from "./list/list.directive"

/**
 * Port implemented by whichever component wants to present the list of datasets
 * (features) of a given type to the user — e.g. `ToolbarCmp`.
 */
export abstract class DatasetDialogHandler {
  abstract showDatasets(listDir: ListDirective, cb: (() => void)|null): void
}

/**
 * Root-level relay that lets unrelated components (e.g. the sibling `StatusbarCmp`)
 * reach the currently registered {@link DatasetDialogHandler}.
 *
 * A component wishing to handle the call registers itself via {@link register}
 * (and should {@link deregister} on destroy). Callers invoke {@link showDatasets};
 * while no handler is registered the call is a no-op.
 */
@Injectable({ providedIn: 'root' })
export class DatasetDialogService {
  #handler: DatasetDialogHandler | null = null
  #dismiss: (() => void) | null = null

  register(handler: DatasetDialogHandler): void {
    this.#handler = handler
    
  }

  deregister(handler: DatasetDialogHandler): void {
    if (this.#handler === handler) {
      this.#handler = null
    }
  }

  showDatasets(listDir: ListDirective, dismissCb: (() => void) | null = null): void {
    this.#handler?.showDatasets(listDir, dismissCb)
  }
}
