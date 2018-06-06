import { Component } from "@angular/core";
import { Observable } from "rxjs";
import { Store, select } from "@ngrx/store";
import { filter,map } from 'rxjs/operators'
import { ViewerStateInterface, AtlasAction, NEWVIEWER } from "../../../services/stateStore.service";

@Component({
  selector : 'ui-splashscreen',
  templateUrl : './splashScreen.template.html',
  styleUrls : [
    `./splashScreen.style.css`
  ]
})

export class SplashScreen{
  loadedTemplate$ : Observable<any[]>
  constructor(private store:Store<ViewerStateInterface>){
    this.loadedTemplate$ = this.store.pipe(
      select('viewerState'),
      filter((state:ViewerStateInterface)=> typeof state !== 'undefined' && typeof state.fetchedTemplates !== 'undefined' && state.fetchedTemplates !== null),
      map(state=>state.fetchedTemplates))
  }

  selectTemplate(template:any){
    this.store.dispatch({
      type : NEWVIEWER,
      selectTemplate : template,
      selectParcellation : template.parcellations[0]
    })
  }
}