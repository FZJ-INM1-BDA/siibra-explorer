import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, Optional, TemplateRef, ViewChild } from "@angular/core";
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

export class FileInputModal implements IFileInputConfig, OnChanges{
  
  @Input('file-input-directive-title')
  title = 'Import'

  @Input('file-input-directive-text')
  allowText: boolean|string = false

  @Input('file-input-directive-file')
  allowFile: boolean|string = true
  
  @Input('file-input-directive-file-ext')
  allowFileExt: string = "*"
  
  @Input('file-input-directive-url')
  allowUrl: boolean|string = true

  urlPlaceholder: string

  @Input('file-input-directive-message')
  messageTmpl: TemplateRef<any>

  @ViewChild('fileInput', { read: ElementRef })
  private fileInputEl: ElementRef<HTMLInputElement>

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data: IFileInputConfig
  ){
    if (data) {
      const { allowFile, allowText, allowUrl, messageTmpl, title, allowFileExt } = data
      this.allowFile = allowFile
      this.allowText = allowText
      this.messageTmpl = messageTmpl
      this.allowUrl = allowUrl
      this.allowFileExt = allowFileExt
      this.title = title || this.title
    }
    this.ngOnChanges()
  }

  ngOnChanges(): void {
    this.fileInputLabel = this.allowFile && typeof this.allowFile === "string"
    ? this.allowFile
    : FILEINPUT_DEFAULT_LABEL
    if (this.allowUrl && typeof this.allowUrl === "string"){
      this.urlPlaceholder = this.allowUrl
    }
  }

  public hasInput = false

  private _urlInput = ''
  set urlInput(val: string) {
    this._urlInput = val
    this.checkImportable()
  }
  get urlInput(){
    return this._urlInput
  }


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
    if (this._urlInput.length > 0) {
      this.importable = true
      return
    }
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

  public evtEmitter = new EventEmitter<TFileInputEvent<'text' | 'file' | 'url'>>()

  runImport(){
    
    if (this._urlInput !== '') {
      this.evtEmitter.emit({
        type: 'url',
        payload: {
          url: this._urlInput
        }
      })
      return
    }
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