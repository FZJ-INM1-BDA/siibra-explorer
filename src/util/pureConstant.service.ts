import { Injectable, OnDestroy } from "@angular/core";
import { Store, createSelector, select } from "@ngrx/store";
import { Observable, merge, Subscription, of, throwError, forkJoin, fromEvent } from "rxjs";
import { VIEWER_CONFIG_FEATURE_KEY, IViewerConfigState } from "src/services/state/viewerConfig.store.helper";
import { shareReplay, tap, scan, catchError, filter, switchMap, map, take } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { BACKENDURL } from './constants'
import { viewerStateSetFetchedAtlases } from "src/services/state/viewerState.store.helper";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { LoggingService } from "src/logging";

const getUniqueId = () => Math.round(Math.random() * 1e16).toString(16)

@Injectable({
  providedIn: 'root'
})

export class PureContantService implements OnDestroy{
  
  public useTouchUI$: Observable<boolean>
  public fetchedAtlases$: Observable<any>
  public darktheme$: Observable<boolean>

  public totalAtlasesLength: number

  private useTouchUiSelector = createSelector(
    state => state[VIEWER_CONFIG_FEATURE_KEY],
    (state: IViewerConfigState) => state.useMobileUI
  )

  public backendUrl = (BACKEND_URL && `${BACKEND_URL}/`.replace(/\/\/$/, '/')) || `${window.location.origin}${window.location.pathname}`

  private workerUpdateParcellation$ = fromEvent(this.workerService.worker, 'message').pipe(
    filter((message: MessageEvent) => message && message.data && message.data.type === 'UPDATE_PARCELLATION_REGIONS'),
    map(({ data }) => data)
  )

  private fetchTemplate = (templateUrl) => this.http.get(`${this.backendUrl}${templateUrl}`, { responseType: 'json' }).pipe(
    switchMap((template: any) => {
      if (template.nehubaConfig) { return of(template) }
      if (template.nehubaConfigURL) { return this.http.get(`${this.backendUrl}${template.nehubaConfigURL}`, { responseType: 'json' }).pipe(
        map(nehubaConfig => {
          return {
            ...template,
            nehubaConfig,
          }
        }),
      )
      }
      throwError('neither nehubaConfig nor nehubaConfigURL defined')
    }),
  )

  private processTemplate = template => forkJoin(
    template.parcellations.map(parcellation => {

      const id = getUniqueId()

      this.workerService.worker.postMessage({
        type: 'PROPAGATE_PARC_REGION_ATTR',
        parcellation,
        inheritAttrsOpts: {
          ngId: (parcellation as any ).ngId,
          relatedAreas: [],
          fullId: null
        },
        id
      })

      return this.workerUpdateParcellation$.pipe(
        filter(({ id: returnedId }) => id === returnedId),
        take(1),
        map(({ parcellation }) => parcellation)
      )
    })
  )

  public getTemplateEndpoint$ = this.http.get<any[]>(`${this.backendUrl}templates`, { responseType: 'json' }).pipe(
    catchError(() => {
      this.log.warn(`fetching root /tempaltes error`)
      return of([])
    }),
    shareReplay(),
  )

  public initFetchTemplate$ = this.getTemplateEndpoint$.pipe(
    switchMap((templates: string[]) => merge(
      ...templates.map(templateName => this.fetchTemplate(templateName).pipe(
        switchMap(template => this.processTemplate(template).pipe(
          map(parcellations => {
            return {
              ...template,
              parcellations
            }
          })
        ))
      )),
    )),
    catchError((err) => {
      this.log.warn(`fetching templates error`, err)
      return of(null)
    }),
  )

  constructor(
    private store: Store<any>,
    private http: HttpClient,
    private log: LoggingService,
    private workerService: AtlasWorkerService,
  ){
    this.darktheme$ = this.store.pipe(
      select(state => state?.viewerState?.templateSelected?.useTheme === 'dark')
    )

    this.useTouchUI$ = this.store.pipe(
      select(this.useTouchUiSelector),
      shareReplay(1)
    )

    this.fetchedAtlases$ = this.http.get(`${BACKENDURL.replace(/\/$/, '')}/atlases/`, { responseType: 'json' }).pipe(
      catchError((err, obs) => of(null)),
      filter(v => !!v),
      tap((arr: any[]) => this.totalAtlasesLength = arr.length),
      switchMap(atlases => merge(
        ...atlases.map(({ url }) => this.http.get(
          /^http/.test(url)
            ? url
            : `${BACKENDURL.replace(/\/$/, '')}/${url}`,
          { responseType: 'json' }))
      )),
      scan((acc, curr) => acc.concat(curr).sort((a, b) => (a.order || 1000) - (b.order || 1001)), []),
      shareReplay(1)
    )

    this.subscriptions.push(
      this.fetchedAtlases$.subscribe(fetchedAtlases => 
        this.store.dispatch(
          viewerStateSetFetchedAtlases({ fetchedAtlases })
        )
      )
    )
  }

  private subscriptions: Subscription[] = []

  ngOnDestroy(){
    while(this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }
}
