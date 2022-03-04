import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Inject, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from "@angular/core";
import { fromEvent, Observable, Subscription } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { SapiRegionalFeatureReceptorModel } from "src/atlasComponents/sapi/type";
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

function transformRadar(input: SapiRegionalFeatureReceptorModel['data']['fingerprints']): RequiredType[]{
  const listRequired: RequiredType[] = []
  for (const key in input) {
    const item = input[key]
    listRequired.push({
      receptor: {
        label: key
      },
      density: {
        mean: item.mean,
        sd: item.std,
        unit: item.unit
      }
    })
    
  }
  return listRequired
}

@Component({
  selector: 'sxplr-sapiviews-features-receptor-fingerprint',
  templateUrl: './fingerprint.template.html',
  styleUrls: [
    './fingerprint.style.css'
  ]
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

    this.setDumbRadarPlease = false   
  }
}
