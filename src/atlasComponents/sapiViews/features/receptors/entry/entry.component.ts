import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import { SapiRegionalFeatureReceptorModel } from "src/atlasComponents/sapi/type";
import { BaseReceptor } from "../base";

@Component({
  selector: 'sxplr-sapiviews-features-receptor-entry',
  templateUrl: `./entry.template.html`,
  styleUrls: [
    `./entry.style.css`
  ]
})

export class Entry extends BaseReceptor implements OnChanges {
  selectedSymbol: string
  symbolsOptions: string[] = []

  async ngOnChanges(simpleChanges: SimpleChanges): Promise<void> {
    await super.ngOnChanges(simpleChanges)
  }

  loading = true
  rerender(): void {
    if (this.receptorData.data.receptor_symbols) {
      this.loading = false
      this.symbolsOptions = Object.keys(this.receptorData.data.receptor_symbols)
    }
    this.cdr.detectChanges()
  }
  constructor(
    sapi: SAPI,
    private cdr: ChangeDetectorRef,
  ){
    super(sapi)
  }

  setSelectedSymbol(select: string){
    this.selectedSymbol = select
  }
}
