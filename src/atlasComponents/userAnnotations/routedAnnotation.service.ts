import { Injectable } from "@angular/core";
import { NEVER } from "rxjs";
import { debounceTime, map, switchMap, take } from "rxjs/operators";
import { RouterService } from "src/routerModule/router.service";
import { SaneUrlSvc } from "src/share/saneUrl/saneUrl.service";
import { userAnnotationRouteKey } from "./constants";
import { ModularUserAnnotationToolService } from "./tools/service";

@Injectable({
  providedIn: 'root'
})

export class RoutedAnnotationService{
  constructor(
    routerSvc: RouterService,
    saneUrlSvc: SaneUrlSvc,
    annSvc: ModularUserAnnotationToolService,
  ){

    routerSvc.customRoute$.pipe(
      debounceTime(160),
      take(1),
      map(obj => obj[userAnnotationRouteKey]),
      switchMap(
        saneUrlKey => {
          return saneUrlKey
            ? saneUrlSvc.getKeyVal(saneUrlKey)
            : NEVER
        }
      )
    ).subscribe(val => {
      if (val[userAnnotationRouteKey]) {
        annSvc.switchAnnotationMode('on')
        for (const ann of val[userAnnotationRouteKey]){
          const geom = annSvc.parseAnnotationObject(ann)
          annSvc.importAnnotation(geom)
        }
      }
      routerSvc.setCustomRoute(userAnnotationRouteKey, null)
    })
  }
}
