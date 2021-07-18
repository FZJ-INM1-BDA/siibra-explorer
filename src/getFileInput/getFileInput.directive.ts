import { Directive, EventEmitter, HostListener, Input, Output, TemplateRef } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { FileInputModal } from "./fileInputModal/fileInputModal.component";
import { IFileInputConfig, TFileInputEvent } from "./type";

@Directive({
  selector: '[file-input-directive]',
  exportAs: 'fileInputDirective'
})

export class FileInputDirective implements IFileInputConfig{

  @Input('file-input-directive-title')
  title = 'Import'

  @Input('file-input-directive-text')
  allowText = false

  @Input('file-input-directive-file')
  allowFile = true

  @Input('file-input-directive-message')
  messageTmpl: TemplateRef<any>

  @Output('file-input-directive')
  evtEmitter = new EventEmitter<TFileInputEvent<'text' | 'file'>>()

  private dialogRef: MatDialogRef<FileInputModal>

  @HostListener('click')
  handleClick(){
    const { title, allowText, allowFile, messageTmpl } = this
    this.dialogRef = this.dialog.open(FileInputModal, {
      width: '65vw',
      data: {
        allowText,
        allowFile,
        title,
        messageTmpl,
      }
    })
    const evSub = this.dialogRef.componentInstance.evtEmitter.subscribe(
      (ev: TFileInputEvent<"text" | "file">) => this.evtEmitter.emit(ev)
    )
    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null
      evSub.unsubscribe()
    })
  }

  constructor(
    private dialog: MatDialog
  ){
    
  }

  clear(){
    if (this.dialogRef) {
      this.dialogRef.componentInstance.clear()
    }
  }

  dismiss(){
    if (this.dialogRef) {
      this.dialogRef.close()
    }
  }
}