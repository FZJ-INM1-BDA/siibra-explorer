import { HttpClient } from "@angular/common/http";
import { Directive, inject } from "@angular/core";
import { combineLatest, concat, of, Subject } from "rxjs";
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

  incidents$ = this.http.get<IncidentJson>(`${environment.BACKEND_URL || ''}live/messages`).pipe(
    shareReplay(1),
  )

  messages$ = this.incidents$.pipe(
    map(resp => resp.incidents.map(formatIncident)),
    catchError((err) => {
      console.log(`Error getting incidents: ${err}`)
      return of([])
    })
  ).pipe(
    scan((acc, curr) => acc.concat(...curr), [] as string[])
  )

  newMessagesCount$ = combineLatest([
    this.incidents$,
    this.seenIncidentUuids$
  ]).pipe(
    map(([incidents, seenIncidents]) => {

      const unseenIncidents = incidents.incidents.filter(incident => {
        const [uuid, hash] = hashIncident(incident)
        return seenIncidents[uuid] !== hash
      })
      return unseenIncidents.length
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
