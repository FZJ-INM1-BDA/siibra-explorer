import { Pipe, PipeTransform } from "@angular/core";
import { NEVER, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { SAPIParcellation } from "src/atlasComponents/sapi/core";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi/type";

export const knownExceptions = {
  supported: {
    /**
     * jba29
     */
    'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290': [
      /**
       * big brain
       */
      'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588'
    ]
  }
}

@Pipe({
  name: 'parcellationSuppportedInSpace',
  pure: false,
})

export class ParcellationSupportedInSpacePipe implements PipeTransform{

  constructor(private sapi: SAPI){}

  public transform(parc: SapiParcellationModel|string, tmpl: SapiSpaceModel|string): Observable<boolean> {
    if (!parc) return NEVER
    const parcId = typeof parc === "string"
      ? parc
      : parc["@id"]
    const tmplId = typeof tmpl === "string"
      ? tmpl
      : tmpl["@id"]
    for (const key in knownExceptions.supported) {
      if (key === parcId && knownExceptions.supported[key].indexOf(tmplId) >= 0) {
        return of(true)
      }
    }
    return this.sapi.registry.get<SAPIParcellation>(parcId).getVolumes().pipe(
      map(volumes => volumes.some(v => v.data.space["@id"] === tmplId))
    )
  }
}