import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Inject, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from "@angular/core";
import { fromEvent, Observable, Subscription } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { TabularFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { DARKTHEME } from "src/util/injectionTokens";
import { BaseReceptor } from "../base";

/**
 * kg-dataset-dumb-radar requires input to be a different shape
 * once the the return signature
 */
type RequiredType = {
  receptor: {
    label: string
  }
  density: {
    mean: number
    sd: number
    unit: string
  }
}

function transformRadar(input: TabularFeature<number>): RequiredType[]{
  const listRequired: RequiredType[] = []
  if (input.index.length !== input.data.length) {
    throw new Error(`Expecting index length: '${input.index.length}' to be the same as data length : '${input.data.length}'.`)
  }
  const rowLength = new Set([input.data.map(row => row.length)])
  if (rowLength.size !== 1) {
    throw new Error(`Expecting all row length to equal, but exists: ${JSON.stringify(Array.from(rowLength))}`)
  }
  input.index.forEach((label, idx) => {
    listRequired.push({
      receptor: {
        label
      },
      density: {
        mean: input.data[idx][0],
        sd: input.data[idx][1],
        unit: ''
      }
    })
  })
  return listRequired
}

@Component({
  selector: 'sxplr-sapiviews-features-receptor-fingerprint',
  templateUrl: './fingerprint.template.html',
  styleUrls: [
    './fingerprint.style.css'
  ],
  exportAs: "sxplrSapiViewsFeaturesReceptorFP"
})

export class Fingerprint extends BaseReceptor implements OnChanges, AfterViewInit, OnDestroy{

  @Output('sxplr-sapiviews-features-receptor-fingerprint-receptor-selected')
  selectReceptor = new EventEmitter<string>()

  @HostListener('click')
  onClick(){
    if (this.mouseOverReceptor)  {
      this.selectReceptor.emit(this.mouseOverReceptor)
    }
  }

  async ngOnChanges(simpleChanges: SimpleChanges) {
    await super.ngOnChanges(simpleChanges)
  }

  constructor(sapi: SAPI, private el: ElementRef, @Inject(DARKTHEME) public darktheme$: Observable<boolean>){
    super(sapi)
  }

  get dumbRadarCmp(){
    return this.el?.nativeElement?.querySelector('kg-dataset-dumb-radar')
  }

  private setDumbRadarPlease = false
  private sub: Subscription[] = []
  private mouseOverReceptor: string

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  ngAfterViewInit(){
    if (this.setDumbRadarPlease) {
      this.rerender()
    }

    this.sub.push(
      fromEvent<CustomEvent>(this.el.nativeElement, 'kg-ds-prv-regional-feature-mouseover').pipe(
        map(ev => ev.detail?.data?.receptor?.label),
        distinctUntilChanged(),
      ).subscribe(label => {
        this.mouseOverReceptor = label
      })
    )
  }

  rerender(): void {
   
    if (!this.dumbRadarCmp) {
      this.setDumbRadarPlease = true
      return
    }
    
    this.dumbRadarCmp.metaBs = this.receptorData.data.receptor_symbols
    this.dumbRadarCmp.radar= transformRadar(this.receptorData.data.fingerprints)

    this.dataBlob$.next(this.getDataBlob())
    this.dataBlobAvailable = true
    this.setDumbRadarPlease = false
  }

  private getDataBlob(): Blob {
    if (!this.receptorData?.data?.fingerprints) throw new Error(`raw data unavailable. Try again later.`)
    const fingerprints = this.receptorData.data.fingerprints
    const output: string[] = []
    output.push(
      ["name", "mean", "std"].join("\t")
    )
    for (const key in fingerprints) {
      output.push(
        [key, fingerprints[key].mean, fingerprints[key].std].join("\t")
      )
    }
    return new Blob([output.join("\n")], { type: 'text/tab-separated-values' })
  }
}
