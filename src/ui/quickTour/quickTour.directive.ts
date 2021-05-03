import { Directive, HostListener } from "@angular/core";
import { QuickTourService } from "./quickTour.service";

@Directive({
  selector: '[quick-tour-opener]'
})

export class QuickTourDirective {

  constructor(
    private quickTourService: QuickTourService
  ){}

    @HostListener('window:keydown', ['$event'])
  keyListener(ev: KeyboardEvent){
    if (ev.key === 'Escape') {
      this.quickTourService.endTour()
    }
  }

    @HostListener('click')
    onClick(){
      this.quickTourService.startTour()
    }
}
