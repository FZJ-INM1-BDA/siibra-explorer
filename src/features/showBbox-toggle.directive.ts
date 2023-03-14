import { Directive, Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { map } from "rxjs/operators";

interface IVoiState {
  showVoiFlag: boolean
}

@Injectable()
class VoiStore extends ComponentStore<IVoiState>{
  constructor(){
    super({ showVoiFlag: false })
  }
}

@Directive({
  selector: '[showBboxToggle]',
  exportAs: 'showBboxToggle',
  providers: [
    VoiStore
  ]
})
export class ShowBBoxToggleDirective {
  public readonly showVoiFlag$ = this.voiStore.state$.pipe(
    map(v => v.showVoiFlag)
  )

  constructor(private readonly voiStore: VoiStore){

  }

  public setState(flag: boolean) {
    this.voiStore.setState({
      showVoiFlag: flag
    })
  }
}
