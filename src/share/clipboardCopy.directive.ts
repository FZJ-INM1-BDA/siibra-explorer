import { Directive, HostListener, Input } from "@angular/core";
import { Clipboard, MatSnackBar } from 'src/sharedModules/angularMaterial.exports'

@Directive({
  selector: '[iav-clipboard-copy]',
  exportAs: 'iavClipboardCopy'
})

export class ClipboardCopy{

  @Input('iav-clipboard-copy')
  copyTarget: string

  constructor(
    private snackBar: MatSnackBar,
    private clipBoard: Clipboard,
  ){
    
  }

  static getWindowLocationHref() {
    return window.location.href
  }

  @HostListener('click')
  onClick(){
    this.clipBoard.copy(this.copyTarget || ClipboardCopy.getWindowLocationHref())
    this.snackBar.open('Copied to clipboard!', null, {
      duration: 1000
    })
  }
}
