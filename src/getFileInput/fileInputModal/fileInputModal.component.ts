import { Component, ElementRef, EventEmitter, Inject, Input, Optional, TemplateRef, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA } from "src/sharedModules/angularMaterial.exports";
import { IFileInputConfig, TFileInputEvent } from "../type";

const FILEINPUT_DEFAULT_LABEL = 'File input'

@Component({
  selector: 'file-input-modal',
  templateUrl: './fileInputModal.template.html',
  styleUrls: [
    './fileInputModal.style.css'
  ]
})

export class FileInputModal implements IFileInputConfig{
  
  @Input('file-input-directive-title')
  title = 'Import'

  @Input('file-input-directive-text')
  allowText = false

  @Input('file-input-directive-file')
  allowFile = true

  @Input('file-input-directive-message')
  messageTmpl: TemplateRef<any>

  @ViewChild('fileInput', { read: ElementRef })
  private fileInputEl: ElementRef<HTMLInputElement>

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data: IFileInputConfig
  ){
    if (data) {
      const { allowFile, allowText, messageTmpl, title } = data
      this.allowFile = allowFile
      this.allowText = allowText
      this.messageTmpl = messageTmpl
      this.title = title || this.title
    }
  }

  public hasInput = false

  private _textInput = ''
  set textInput(val: string) {
    this._textInput = val
    this.checkImportable()
  }
  get textInput(){
    return this._textInput
  }

  public fileInputLabel: string = FILEINPUT_DEFAULT_LABEL
  public hasFileInput = false

  private _fileInput: File
  set fileInput(val: File){
    this._fileInput = val
    this.hasFileInput = !!this.fileInput
    this.fileInputLabel = this.hasFileInput
      ? this._fileInput.name
      : FILEINPUT_DEFAULT_LABEL

    this.checkImportable()
  }
  get fileInput(){
    return this._fileInput
  }
  handleFileInputChange(ev: Event){
    const target = ev.target as HTMLInputElement
    this.fileInput = target.files[0]
  }

  handleFileDrop(files: File[]){
    this.fileInput = files[0]
  }

  public importable = false
  checkImportable(){
    if (this._textInput.length > 0) {
      this.importable = true
      return
    }
    if (this.hasFileInput){
      this.importable = true
      return
    }
    this.importable = false
  }

  clear(){
    this.textInput = ''
    this.fileInput = null
  }

  public evtEmitter = new EventEmitter<TFileInputEvent<'text' | 'file'>>()

  runImport(){
    if (this._textInput !== '') {
      this.evtEmitter.emit({
        type: 'text',
        payload: {
          input: this._textInput
        }
      })
      return
    }
    if (this.hasFileInput) {
      const files = [this.fileInput]
      this.evtEmitter.emit({
        type: 'file',
        payload: { files }
      })
      return
    }
  }
}