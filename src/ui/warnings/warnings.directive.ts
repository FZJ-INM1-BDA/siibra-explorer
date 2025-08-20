import { HttpClient } from "@angular/common/http";
import { Directive } from "@angular/core";
import { merge, of } from "rxjs";
import { catchError, map, scan, shareReplay } from "rxjs/operators";
import { IncidentJson, Incident } from "src/atlasComponents/sapi/sxplrTypes";
import { environment } from "src/environments/environment.common";

@Directive({
  selector: '[sxplr-warnings]',
  exportAs: "sxplrWarnings",
  standalone: true
})

export class SxplrWarningsDirective {

  #country$ = this.http.get(`${environment.BACKEND_URL || ''}live/geolocation`)

  warnings$ = merge(
    this.#country$.pipe(
      map(json => {
        console.log("Decoded country", json)
        const conCode = json?.['continent']?.['code']
        if (conCode === "EU") {
          return []
        }
        return [
          `As the infrastructure hosting siibra is located in EU, the users outside EU may experience sub-par loading times. We are aware of the issue, and are persuing remedies.

IP lookup carried out on EBRAINS infrastructure with static data provided by www.maxmind.com under CC-BY-SA 4.0 license.`,
        ]
      })
    )
  ).pipe(
    catchError(() => of([] as string[])),
    scan((acc, curr) => acc.concat(...curr), [] as string[]),
    shareReplay(1),
  )

  incidents$ = this.http.get<IncidentJson>(`${environment.BACKEND_URL || ''}live/messages`)

  hasWarnings$ = this.warnings$.pipe(
    map(val => val.length > 0)
  )

  messages$ = merge(
    this.warnings$,
    this.incidents$.pipe(
      map(resp => resp.incidents.map(formatIncident)),
      catchError((err) => {
        console.log(`Error getting incidents: ${err}`)
        return of([])
      })
    )
  ).pipe(
    scan((acc, curr) => acc.concat(...curr), [] as string[])
  )

  hasMessages$ = this.messages$.pipe(
    map(messages => messages.length > 0)
  )
  
  constructor(
    private http: HttpClient,
  ){

  }
}

function formatUpdate(update: Incident['updates'][number]){
  return `${update.datetime}: ${update.message}`
}

function formatIncident(incident: Incident){
  return `${incident.title}

${incident.updates.map(formatUpdate).join("\n")}`
}
