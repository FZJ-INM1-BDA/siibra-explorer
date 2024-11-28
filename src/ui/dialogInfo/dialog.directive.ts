import { Directive, EventEmitter, HostListener, Input, Output, TemplateRef } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from 'src/sharedModules/angularMaterial.exports'
import { DialogFallbackCmp } from "./tmpl/tmpl.component"

type DialogSize = 's' | 'm' | 'l' | 'xl' | 'auto'

const sizeDict: Record<DialogSize, Partial<MatDialogConfig>> = {
  's': {
    width: '25vw',
    height: '25vh'
  },
  'm': {
    width: '50vw',
    height: '50vh'
  },
  'l': {
    width: '75vw',
    height: '75vh'
  },
  'xl': {
    width: '90vw',
    height: '90vh'
  },
  'auto': {}
}

@Directive({
  selector: `[sxplr-dialog]`,
  exportAs: 'sxplrDialog',
})

export class DialogDirective{

  @Input('sxplr-dialog')
  templateRef: TemplateRef<unknown>|string

  @Input('sxplr-dialog-size')
  size: DialogSize = 'auto'

  @Input('sxplr-dialog-data')
  data: any = {}

  @Input('sxplr-dialog-config')
  config: Partial<MatDialogConfig> = {}

  @Output('sxplr-dialog-closed')
  closed = new EventEmitter()

  #dialogRef: MatDialogRef<unknown>

  constructor(private matDialog: MatDialog){}

  @HostListener('click')
  onClick(data: any={}){
    const tmpl = this.templateRef instanceof TemplateRef
      ? this.templateRef
      : DialogFallbackCmp

    this.#dialogRef = this.matDialog.open(tmpl, {
      autoFocus: null,
      data: {...this.data, ...data},
      ...(sizeDict[this.size] || {}),
      ...this.config
    })

    this.#dialogRef.afterClosed().subscribe(val => {
      this.closed.next(val)
    })
  }

  close(){
    if (this.#dialogRef) {
      this.#dialogRef.close()
      this.#dialogRef = null
    }
  }
}
