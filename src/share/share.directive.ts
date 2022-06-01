import { Directive, HostListener } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { ShareSheetComponent } from "./shareSheet/shareSheet.component"


@Directive({
  selector: `[sxplr-share-view]`
})

export class ShareDirective{
  constructor(private btmSht: MatBottomSheet){

  }
  @HostListener('click')
  onClick(){
    this.btmSht.open(ShareSheetComponent)
  }
}
