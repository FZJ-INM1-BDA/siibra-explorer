import { Injectable } from "@angular/core";
import { NEVER } from "rxjs";
import { debounceTime, map, switchMap, take, withLatestFrom } from "rxjs/operators";
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
      ),
      withLatestFrom(annSvc.annotationTools$)
    ).subscribe(([val, tools]) => {
      if (val[userAnnotationRouteKey]) {
        annSvc.focus()
        for (const ann of val[userAnnotationRouteKey]){
          const geom = annSvc.parseAnnotationObject(ann)
          for (const tool of tools) {
            const { toolInstance, target } = tool
            if (!!target && geom instanceof target) {
              toolInstance.addAnnotation(geom)
              continue
            }
          }
        }
      }
      routerSvc.setCustomRoute(userAnnotationRouteKey, null)
    })
  }
}
