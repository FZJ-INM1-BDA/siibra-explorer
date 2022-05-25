import { AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Observable } from "rxjs";
import { SAPI } from "src/atlasComponents/sapi";
import { PARSE_TYPEDARRAY } from "src/atlasComponents/sapi/sapi.service";
import { DARKTHEME } from "src/util/injectionTokens";
import { BaseReceptor } from "../base";

@Component({
  selector: `sxplr-sapiviews-features-receptor-profile`,
  templateUrl: './profile.template.html',
  styleUrls: [
    './profile.style.css'
  ],
  exportAs: "sxplrSapiViewsFeaturesReceptorProfile"
})

export class Profile extends BaseReceptor implements AfterViewInit, OnChanges{

  @Input('sxplr-sapiviews-features-receptor-profile-selected-symbol')
  selectedSymbol: string

  private pleaseRender = false
  dumbLineData: Record<number, number>

  constructor(sapi: SAPI, private el: ElementRef, @Inject(DARKTHEME) public darktheme$: Observable<boolean> ){
    super(sapi)
  }

  async ngOnChanges(simpleChanges: SimpleChanges) {
    await super.ngOnChanges(simpleChanges)
    if (!this.receptorData) {
      return
    }
    if (this.selectedSymbol) {
      this.rerender()
    }
  }

  ngAfterViewInit(): void {
    if (this.pleaseRender) {
      this.rerender()
    }
  }

  get dumbLineCmp(){
    return this.el?.nativeElement?.querySelector('kg-dataset-dumb-line')
  }

  async rerender() {
    this.dataBlobAvailable = false
    if (!this.dumbLineCmp) {
      this.pleaseRender = true
      return
    }
    this.pleaseRender = false
    this.dumbLineData = null
    
    if (this.receptorData?.data?.profiles?.[this.selectedSymbol]) {
      const { rawArray } = await this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(
        this.receptorData.data.profiles[this.selectedSymbol].density,
        PARSE_TYPEDARRAY.RAW_ARRAY
      )
      if (rawArray.length !== 1) {
        this.error = `expected rawArray.length to be 1, but is ${rawArray.length} instead`
        return
      }
      const prof = rawArray[0]
      this.dumbLineData = {}
      for (const idx in prof) {
        this.dumbLineData[idx] = prof[idx]
      }
      this.dataBlob$.next(this.getDataBlob())
      this.dataBlobAvailable = true
      this.dumbLineCmp.profileBs = this.dumbLineData
    }
  }

  private getDataBlob(): Blob {
    if (!this.dumbLineData) throw new Error(`data has not been populated. Perhaps wait until render finishes?`)
    const output: string[] = []
    output.push(
      ["cortical depth (%)", "receptor density (fmol/mg)"].join("\t")
    )
    for (const key in this.dumbLineData) {
      output.push(
        [key, this.dumbLineData[key]].join("\t")
      )
    }
    return new Blob([output.join("\n")], { type: 'text/tab-separated-values' })
  }
}
