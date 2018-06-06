import { Component, HostBinding } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, FETCHED_TEMPLATES, safeFilter } from "../services/stateStore.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector : 'atlas-viewer',
  templateUrl : './atlasViewer.template.html',
  styleUrls : [
    `./atlasViewer.style.css`
  ]
})

export class AtlasViewer{

  @HostBinding('attr.darktheme') 
  darktheme : boolean = false

  selectedTemplate$ : Observable<any>

  constructor(private store : Store<ViewerStateInterface>){
    const urls = [
      'res/json/infant.json',
      'res/json/bigbrain.json',
      'res/json/colin.json',
      'res/json/MNI152.json',
      'res/json/waxholmRatV2_0.json',
      'res/json/allenMouse.json'
    ]

    Promise.all(urls.map(url=>
      fetch(url)
        .then(res=>
          res.json())
        .then(json=>json.nehubaConfig && !json.nehubaConfigURL ? 
          Promise.resolve(json) :
          fetch(json.nehubaConfigURL)
            .then(r=>r.json())
            .then(nehubaConfig=>Promise.resolve(Object.assign({},json,{ nehubaConfig })))
        )))
      .then(arrJson=>
        this.store.dispatch({
          type : FETCHED_TEMPLATES,
          fetchedTemplate : arrJson
        }))
      .catch(console.error)

      this.selectedTemplate$ = this.store.pipe(
        select('newViewer'),
        safeFilter('templateSelected'),
        map(state=>state.templateSelected))

      this.selectedTemplate$.subscribe(template=>this.darktheme = template.useTheme === 'dark')
  }
}