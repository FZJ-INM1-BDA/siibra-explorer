import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { SNACKBAR_MESSAGE } from "./state/uiState.store";
import { KgSingleDatasetService } from "src/ui/databrowserModule/kgSingleDatasetService.service";
import { IavRootStoreInterface } from "./stateStore.service";

/**
 * experimental service handling local user files such as nifti and gifti
 */

@Injectable({
  providedIn: 'root'
})

export class LocalFileService {
  public SUPPORTED_EXT = SUPPORTED_EXT
  private supportedExtSet = new Set(SUPPORTED_EXT)

  constructor(
    private store: Store<IavRootStoreInterface>,
    private singleDsService: KgSingleDatasetService
  ){

  }

  private niiUrl

  public handleFileDrop(files: File[]){
    try {
      this.validateDrop(files)
      for (const file of files) {
        const ext = this.getExtension(file.name)
        switch (ext) {
          case NII: {
            this.handleNiiFile(file)
            break;
          }
          default:
            throw new Error(`File ${file.name} does not have a file handler`)
        }
      }
    } catch (e) {
      this.store.dispatch({
        type: SNACKBAR_MESSAGE,
        snackbarMessage: `Opening local NIFTI error: ${e.toString()}`
      })
    }
  }

  private getExtension(filename:string) {
    const match = /(\.\w*?)$/i.exec(filename)
    return (match && match[1]) || ''
  }

  private validateDrop(files: File[]){
    if (files.length !== 1) {
      throw new Error('Interactive atlas viewer currently only supports drag and drop of one file at a time')
    }
    for (const file of files) {
      const ext = this.getExtension(file.name)
      if (!this.supportedExtSet.has(ext)) {
        throw new Error(`File ${file.name}${ext === '' ? ' ' : (' with extension ' + ext)} cannot be loaded. The supported extensions are: ${this.SUPPORTED_EXT.join(', ')}`)
      }
    }
  }

  private handleNiiFile(file: File){

    if (this.niiUrl) {
      URL.revokeObjectURL(this.niiUrl)
    }
    this.niiUrl = URL.createObjectURL(file)
    this.singleDsService.showNewNgLayer({
      url: this.niiUrl
    })

    this.showLocalWarning()
  }

  private showLocalWarning() {
    this.store.dispatch({
      type: SNACKBAR_MESSAGE,
      snackbarMessage: `Warning: sharing URL will not share the loaded local file`
    })
  }
}

const NII = `.nii`
const GII = '.gii'

const SUPPORTED_EXT = [
  NII,
  GII
]