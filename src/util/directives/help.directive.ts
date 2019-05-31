import { Directive, ElementRef, Renderer2 } from '@angular/core'
import { AtlasViewerConstantsServices } from '../../atlasViewer/atlasViewer.constantService.service';

@Directive({
  selector : 'div[helpdirective]'
})
export class HelpDirective{
  constructor(
    // rd2:Renderer2,
    private elementRef:ElementRef,
    private constantService:AtlasViewerConstantsServices
  ){
    /**
     * TODO angular does not currently (7.1.2019) support capture events. when it does, use rd should be more efficient
     */
    // rd2.listen(elementRef.nativeElement, 'keydown', this.keydownHandler.bind(this))
    
  }

  keydownHandler(ev:KeyboardEvent){
    
    const target = <HTMLElement> ev.target
    const tagName = target.tagName

    if (tagName === 'SELECT' || tagName === 'INPUT' || tagName === 'TEXTAREA')
      return
    
    if (ev.key === 'h' || ev.key === 'H' || ev.key === '?') {
      ev.stopPropagation()
      ev.preventDefault()
      /**
       * call help modal
       */
      this.constantService.showHelpSubject$.next()
    }
  }

  ngAfterViewInit(){
    this.elementRef.nativeElement.addEventListener('keydown', this.keydownHandler.bind(this), true)
  }
}