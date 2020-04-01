import { Injectable } from "@angular/core";
import { AtlasViewerAPIServices } from "src/atlasViewer/atlasViewer.apiService.service";
import { ToastHandler } from "src/util/pluginHandlerClasses/toastHandler";
import {MatSnackBar, MatSnackBarConfig} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root',
})

export class UIService {
  constructor(
    private snackbar: MatSnackBar,
    private apiService: AtlasViewerAPIServices,
  ) {
    this.apiService.interactiveViewer.uiHandle.getToastHandler = () => {
      const toasthandler = new ToastHandler()
      let handle
      toasthandler.show = () => {
        handle = this.showMessage(toasthandler.message, null, {
          duration: toasthandler.timeout,
        })
      }

      toasthandler.hide = () => {
        if (handle) { handle.dismiss() }
        handle = null
      }
      return toasthandler
    }
  }

  public showMessage(message: string, actionBtnTxt: string = 'Dismiss', config?: Partial<MatSnackBarConfig>) {
    return this.snackbar.open(message, actionBtnTxt, config)
  }
}
