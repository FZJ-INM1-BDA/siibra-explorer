import { Directive, HostListener } from "@angular/core";
import { MatBottomSheet } from 'src/sharedModules/angularMaterial.exports'
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
