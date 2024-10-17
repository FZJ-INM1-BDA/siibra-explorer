import { Component } from "@angular/core";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { MatSnackBar } from "src/sharedModules";

@Component({
  selector: 'freemode-ui',
  templateUrl: './freemode-ui.template.html',
  styleUrls: [
    './freemode-ui.style.scss'
  ]
})

export class FreeModeUIComponent {
  constructor(private snackbar: MatSnackBar, private worker: AtlasWorkerService){
    const { LayerManager, UrlHashBinding } = (window as any).export_nehuba.getNgPatchableObj()
    
    UrlHashBinding.prototype.setUrlHash = () => {
      // this.log.log('seturl hash')
      // this.log.log('setting url hash')
    }

    UrlHashBinding.prototype.updateFromUrlHash = () => {
      // this.log.log('update hash binding')
    }

    /* TODO find a more permanent fix to disable double click */
    LayerManager.prototype.invokeAction = (arg) => {

      /**
       * The emitted value does not affect the region selection
       * the region selection is taken care of in nehubaContainer
       */
      /* eslint-disable-next-line no-empty */
      if (arg === 'select') {
      }
    }

  }

  #getCfg(source: string) {
    return {
      "configName": "",
      "globals": {
        "hideNullImageValues": true,
        "useNehubaLayout": {
          "keepDefaultLayouts": false
        },
        "useNehubaMeshLayer": true,
        "rightClickWithCtrlGlobal": false,
        "zoomWithoutCtrlGlobal": false,
        "useCustomSegmentColors": true
      },
      "zoomWithoutCtrl": true,
      "hideNeuroglancerUI": true,
      "rightClickWithCtrl": true,
      "rotateAtViewCentre": true,
      "enableMeshLoadingControl": true,
      "zoomAtViewCentre": true,
      "restrictUserNavigation": true,
      "disableSegmentSelection": false,
      "dataset": {
        "initialNgState": {
          "showDefaultAnnotations": false,
          "layers": {
            "dropped-nii": {
              type: "image",
              source
            }
          },
        }
      },
      "layout": {
        "views": "hbp-neuro",
        "useNehubaPerspective": {
          "enableShiftDrag": false,
          "doNotRestrictUserNavigation": false,
          "mesh": {
            "removeBasedOnNavigation": true,
            "flipRemovedOctant": true
          },
          "hideImages": false,
          "waitForMesh": false,
        }
      }
    }
  }
  async onDrop(files: File[]){
    if (files.length == 0) {
      this.snackbar.open("No files were dropped", "Dismiss", {
        duration: 5000
      })
      return
    }
    if (files.length > 1) {
      this.snackbar.open("Multiple files are not supported.", "Dismiss", {
        duration: 5000
      })
      return
    }
    const file = files[0]
    if (!file.name.toLowerCase().endsWith(".nii") && !file.name.toLowerCase().endsWith(".nii.gz")) {
      this.snackbar.open("Only files with .nii or .nii.gz extensions are supported.", "Dismiss", {
        duration: 5000
      })
      return
    }
    const { pako, createNehubaViewer } = (window as any).export_nehuba
    
    let buf = await file.arrayBuffer()
    if (file.name.toLowerCase().endsWith(".gz")) {
      buf = pako.inflate(buf).buffer
    }
    const { result } = await this.worker.sendMessage({
      method: "PROCESS_NIFTI",
      param: {
        nifti: buf,
      },
      transfers: [buf],
    })
    const { buffer } = result
    const url = URL.createObjectURL(new Blob([buffer]))
    const config = this.#getCfg(`nifti://${url}`)
    createNehubaViewer(config)
  }
}
