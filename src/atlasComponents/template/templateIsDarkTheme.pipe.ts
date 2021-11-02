import { OnDestroy, Pipe, PipeTransform } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import { viewerStateSelectedTemplateFullInfoSelector } from "src/services/state/viewerState/selectors";
import { IHasId } from "src/util/interfaces";

@Pipe({
  name: 'templateIsDarkTheme',
  pure: true,
})

export class TemplateIsDarkThemePipe implements OnDestroy, PipeTransform{

  private templateFullInfo: any[] = []
  constructor(store: Store<any>){
    this.sub.push(
      store.pipe(
        select(viewerStateSelectedTemplateFullInfoSelector)
      ).subscribe(val => this.templateFullInfo = val)
    )
  }

  private sub: Subscription[] = []

  ngOnDestroy(){
    while(this.sub.length) this.sub.pop().unsubscribe()
  }

  public transform(template: IHasId): boolean{
    const found = this.templateFullInfo.find(t => t['@id'] === template["@id"])
    return found && found.darktheme
  }
}