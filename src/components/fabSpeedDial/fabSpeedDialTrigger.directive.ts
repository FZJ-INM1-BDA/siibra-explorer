import { Directive, HostListener } from "@angular/core";
import { FabSpeedDialService } from "./fabSpeedDial.service";

@Directive({
  selector: '[iav-fab-speed-dial-trigger]',
  exportAs: 'iavFabSpeedDialTrigger'
})

export class FabSpeedDialTrigger{

  constructor(private fabService: FabSpeedDialService ){}

  @HostListener('click')
  triggerClicked(){
    this.fabService.toggle()
  }
}
