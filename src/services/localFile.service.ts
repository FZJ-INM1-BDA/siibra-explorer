import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { DatabrowserService } from "src/ui/databrowserModule/databrowser.service";

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
    private snackBar: MatSnackBar,
    private dbService: DatabrowserService  
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
      this.snackBar.open(e, `Dismiss`, {
        duration: 5000
      })
      console.error(e)
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
    this.dbService.showNewNgLayer({
      url: this.niiUrl
    })

    this.showLocalWarning()
  }

  private showLocalWarning() {
    this.snackBar.open(`Warning: sharing URL will not share the loaded local file`, 'Dismiss', {
      duration: 5000
    })
  }
}

const NII = `.nii`
const GII = '.gii'

const SUPPORTED_EXT = [
  NII,
  GII
]