import { HttpClient } from "@angular/common/http";
import { Directive, inject } from "@angular/core";
import { combineLatest, concat, merge, of, Subject } from "rxjs";
import { catchError, debounceTime, map, scan, shareReplay, switchMap, take, takeUntil } from "rxjs/operators";
import { IncidentJson, Incident } from "src/atlasComponents/sapi/sxplrTypes";
import { environment } from "src/environments/environment.common";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { QuickHash } from "src/util/fn"

const SEEN_INCIDENT_KEY = `sxplr.seenincident`

@Directive({
  selector: '[sxplr-warnings]',
  exportAs: "sxplrWarnings",
  standalone: true,
  hostDirectives: [
    DestroyDirective
  ]
})

export class SxplrWarningsDirective {

  #destroy$ = inject(DestroyDirective).destroyed$

  #country$ = this.http.get(`${environment.BACKEND_URL || ''}live/geolocation`)

  #seeIncidents$ = new Subject<[string, string][]>()

  seenIncidentUuids$ = of(localStorage.getItem(SEEN_INCIDENT_KEY) || '{}').pipe(
    map(s => JSON.parse(s) as Record<string, string>),
    switchMap(src => {
      return concat(
        of(src),
        this.#seeIncidents$.pipe(
          map(incidents => {
            const updateHash = incidents.reduce((acc, curr) => {
              const [ uuid, hash ] = curr
              return {
                ...acc,
                [uuid]: hash,
              }
            }, {} as Record<string, string>)
            return {
              ...src,
              ...updateHash,
            }
          })
        )
      )
    }),
    shareReplay(1),
  )

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

  incidents$ = this.http.get<IncidentJson>(`${environment.BACKEND_URL || ''}live/messages`).pipe(
    shareReplay(1),
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

  newMessagesCount$ = combineLatest([
    this.warnings$,
    this.incidents$,
    this.seenIncidentUuids$
  ]).pipe(
    map(([warnings, incidents, seenIncidents]) => {

      const unseenIncidents = incidents.incidents.filter(incident => {
        const [uuid, hash] = hashIncident(incident)
        return seenIncidents[uuid] !== hash
      })
      return warnings.length + unseenIncidents.length
    })
  )
  
  constructor(
    private http: HttpClient,
  ){
    this.seenIncidentUuids$.pipe(
      takeUntil(this.#destroy$),
      debounceTime(160),
    ).subscribe(records => {
      localStorage.setItem(SEEN_INCIDENT_KEY, JSON.stringify(records))
    })

  }

  async markIncidentsSeen(){
    const resp = await this.incidents$.pipe(
      take(1)
    ).toPromise()
    
    this.#seeIncidents$.next(resp.incidents.map(hashIncident))
  }
}

function formatUpdate(update: Incident['updates'][number]){
  return `${update.datetime}: ${update.message}`
}

function formatIncident(incident: Incident){
  return `${incident.title}

- ${incident.updates.map(formatUpdate).join("\n")}`
}

function hashIncident(incident: Incident): [string, string] {
  const uuid = incident.id
  const hash = QuickHash.GetHash(JSON.stringify(incident.updates))
  return [uuid, hash]
}
