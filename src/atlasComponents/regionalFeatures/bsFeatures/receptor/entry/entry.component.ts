import { Component, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { filter, map, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { BsFeatureReceptorService } from '../service'

@Component({
  selector: 'bs-features-receptor-entry',
  templateUrl: './entry.template.html',
  styleUrls: [
    './entry.style.css'
  ],
})

export class BsFeatureReceptorEntry extends BsRegionInputBase implements OnDestroy{

  private sub: Subscription[] = []

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  public receptorResp$ = this.region$.pipe(
    filter(v => !!v),
    switchMap(val => this.featureReceptorService.getFeatureFromRegion(val)),
    shareReplay(1),
  )

  public onSelectReceptor(receptor: string){
    this.selectedReceptor = receptor
  }

  public selectedReceptor = null
  public allReceptors$ = this.receptorResp$.pipe(
    map(val => val?.receptor_symbols),
    filter(v => !!v),
    map(obj => Object.keys(obj)),
    startWith<string[]>([])
  )

  constructor(
    private featureReceptorService: BsFeatureReceptorService
  ){
    super()

  }
}
