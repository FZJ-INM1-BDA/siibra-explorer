import { Directive, EventEmitter, Inject, Input, OnDestroy, OnInit, Optional, Output } from "@angular/core";
import { catchError, debounceTime, filter, map, shareReplay, switchMap, tap } from "rxjs/operators";
import { SandsToNumPipe } from "./sandsToNum.pipe"
import { BehaviorSubject, combineLatest, concat, EMPTY, Observable, of, Subject, Subscription } from "rxjs";
import { TFace, TSandsPoint } from "src/util/types";
import { SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";
import { EXPECTED_SIIBRA_API_VERSION, SAPI } from "src/atlasComponents/sapi/sapi.service";
import { TZipFileConfig } from "src/zipFilesOutput/type";
import { environment } from "src/environments/environment"
import { translateRegionName } from "src/atlasComponents/sapi/translateV3";
import { AnnotationLayer } from "src/atlasComponents/annotations";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor } from "src/util/injectionTokens";

const pipe = new SandsToNumPipe()

const DOING_PROB_ASGMT = "Performing probabilistic assignment ..."
const DOING_LABEL_ASGMT = "Probabilistic assignment failed. Performing labelled assignment ..."

const LABELLED_MAP_ASSIGNMENT_REGRESSION = `Labelled point assignment is currently experiencing some regression. For more detail, please visit

[https://siibra-explorer.readthedocs.io/en/stable/releases/v2.14.12/](https://siibra-explorer.readthedocs.io/en/stable/releases/v2.14.12/)`

@Directive({
  selector: '[point-assignment]',
  exportAs: 'ptAsgmt'
})

export class PointAssignmentDirective implements OnDestroy, OnInit{
  #sub: Subscription[] = []
  #destroyCb: (() => void)[] = []
  #annotLayerName = "ptAsmtLayerName"
  #pointId = `${this.#annotLayerName}-pt`
  #layer: AnnotationLayer
  #onHoverSub: Subscription
  #hovered = false

  @Output()
  onAnnotationClick = new EventEmitter()

  ngOnDestroy(): void {
    if (this.#layer) {
      this.#layer.dispose()
      this.#layer = null
    }
    while (this.#sub.length > 0) {
      this.#sub.pop().unsubscribe()
    }
    if (this.#onHoverSub) {
      this.#onHoverSub.unsubscribe()
    }
  }

  ngOnInit(): void {
    this.#sub.push(
      this.point$.subscribe(pt => {
        if (!pt) {
          return
        }
        if (!this.#layer) {
          this.#layer = new AnnotationLayer(this.#annotLayerName, "#ff0000")
        }
        
        this.#layer.updateAnnotation({
          point: pt.coordinates.map(v => v.value) as [number, number, number],
          type: "point",
          id: this.#pointId
        })

        const message = {
          message: "",
          materialIcon: "place"
        }

        if (!this.#onHoverSub) {
          this.#onHoverSub = this.#layer.onHover.subscribe(hovered => {
            this.#hovered = !!hovered

            if (this.hoverInterceptor) {
              if (this.#hovered) {
                message.message = `Selected point (${pt.coordinates.map(v => (v.value / 1e6).toFixed(2)).join(", ")}) mm`
                this.hoverInterceptor.append(message)
              } else {
                this.hoverInterceptor.remove(message)
              }
            }

            if (this.clickInterceptor) {
              const fn = (arg: unknown) => {
                if (this.#hovered){
                  this.onAnnotationClick.emit(arg)
                  return false
                }
                return true
              }
              this.#destroyCb.push(() => this.clickInterceptor.deregister(fn))
              this.clickInterceptor.register(fn)
            }
          })
        }
      })
    )
  }

  #assignmentType: Subject<"labelled" | "statistical" | null> = new BehaviorSubject(null)
  assignmentType$ = this.#assignmentType.asObservable()
  
  #busy$ = new BehaviorSubject<typeof DOING_PROB_ASGMT | typeof DOING_LABEL_ASGMT>(null)
  busy$ = this.#busy$.asObservable()

  #error$ = new BehaviorSubject<string>(null)
  error$ = this.#error$.asObservable()

  point$ = new BehaviorSubject<TSandsPoint>(null)
  @Input()
  set point(val: TSandsPoint|TFace) {
    if (val?.["@type"] === "siibra-explorer/surface/face") {
      return
    }
    this.point$.next(val)
  }
  
  template$ = new BehaviorSubject<SxplrTemplate>(null)
  @Input()
  set template(val: SxplrTemplate) {
    this.template$.next(val)
  }

  parcellation$ = new BehaviorSubject<SxplrParcellation>(null)
  @Input()
  set parcellation(val: SxplrParcellation) {
    this.parcellation$.next(val)
  }

  @Output()
  clickOnRegionName = new EventEmitter<{ target: string, event: MouseEvent }>()

  coordTxt$ = this.point$.pipe(
    map(val => {
      if (!val) {
        return null
      }
      const xformedCoord = pipe.transform(val)
      return `${xformedCoord.coords.map(v => v.toFixed(2) + "mm").join(", ")}`
    }),
  )

  infoMsg$: Observable<string> = combineLatest([
    this.coordTxt$,
    this.parcellation$,
    this.template$,
    this.busy$.pipe(
      filter(busyWith => busyWith === DOING_LABEL_ASGMT || busyWith === DOING_PROB_ASGMT)
    ),
  ]).pipe(
    map(([ coordText, parcellation, template, busyWith ]) => {
      let maptype = "map"
      let warningMsg = ""
      if (busyWith === DOING_LABEL_ASGMT) {
        maptype = "labelled map"
        warningMsg = LABELLED_MAP_ASSIGNMENT_REGRESSION
      }
      if (busyWith === DOING_PROB_ASGMT) {
        maptype = "statistical map"
      }
      return `Assignment of \`${coordText}\` to the ${maptype} of \`${parcellation.name}\` in \`${template.name}\`.

For more detail, see [siibra-python documentation](https://siibra-python.readthedocs.io/en/v0.4eol/examples/05_anatomical_assignment/001_coordinates.html).

${warningMsg}`
    })
  )

  df$: Observable<PathReturn<"/map/assign">> = combineLatest([
    this.point$,
    this.parcellation$,
    this.template$,
  ]).pipe(
    debounceTime(16),
    switchMap(([ point, parcellation, template ]) => {

      this.#error$.next(null)

      if (!point || !parcellation || !template) {
        return EMPTY
      }
      const { ['@id']: ptSpaceId} = point.coordinateSpace
      if (ptSpaceId !== template.id) {
        console.warn(`point coordination space id ${ptSpaceId} is not the same as template id ${template.id}.`)
        return EMPTY
      }
      this.#busy$.next(DOING_PROB_ASGMT)
      return concat(
        of(null),
        this.sapi.v3Get("/map/assign", {
          query: {
            parcellation_id: parcellation.id,
            point: point.coordinates.map(v => `${v.value/1e6}mm`).join(','),
            space_id: template.id,
            sigma_mm: 0
          }
        }).pipe(
          tap(() => this.#assignmentType.next("statistical")),
          catchError(() => {
            this.#busy$.next(DOING_LABEL_ASGMT)
            return this.sapi.v3Get("/map/assign", {
              query: {
                parcellation_id: parcellation.id,
                point: point.coordinates.map(v => `${v.value/1e6}mm`).join(','),
                space_id: template.id,
                sigma_mm: 0,
                assignment_type: "labelled"
              }
            }).pipe(
              tap(() => this.#assignmentType.next("labelled"))
            )
          }),
          catchError((err) => {
            this.#busy$.next(null)
            this.#error$.next(err.toString())
            return of(null)
          }),
          tap(() => this.#busy$.next(null)),
        )
      )
    }),
    shareReplay(1),
  )

  columns$ = this.df$.pipe(
    map(df => df.columns as string[])
  )

  dfCsv$ = this.df$.pipe(
    map(df => df && generateCsv(df))
  )

  zipfileConfig$: Observable<TZipFileConfig[]> = combineLatest([
    this.point$,
    this.parcellation$,
    this.template$,
    this.dfCsv$
  ]).pipe(
    map(([ pt, parc, tmpl, dfCsv ]) => {
      return [{
        filename: 'README.md',
        filecontent: generateReadMe(pt, parc, tmpl)
      }, {
        filename: 'pointassignment.csv',
        filecontent: dfCsv
      }] as TZipFileConfig[]
    })
  )


  constructor(
    protected sapi: SAPI,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR) 
    protected hoverInterceptor: HoverInterceptor,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR)
    protected clickInterceptor: ClickInterceptor,
  ){

  }

  selectRegion(regionName: string, event: MouseEvent){
    this.clickOnRegionName.emit({ target: translateRegionName(regionName), event })
  }
  
}

function escapeFactory(chars: string[] = []){
  const search = new RegExp(`[${chars.join('').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g')
  return function escape(s: string) {
    return s.replace(search, s => `\\${s}`)
  }
}

const escapeDoubleQuotes = escapeFactory(['"'])

function processObject(item: unknown): string {
  
  // region
  if (typeof item === "object" && item?.['@type'] === "siibra-0.4/region") {
    return item['name']
  }

  // array
  if (item instanceof Array) {
    const value = item.map(i => processObject(i)).map(escapeDoubleQuotes).join(", ")
    return `"${value}"`
  }

  // fallback
  return JSON.stringify(item)
}

function processRow(v: unknown[]): string{
  const returnValue: string[] = []
  for (const item of v) {
    returnValue.push(processObject(item))
  }
  return returnValue.join(",")
}

function generateCsv(df: PathReturn<"/map/assign">) {
  return [
    df.columns.map(escapeDoubleQuotes).map(v => `"${v}"`).join(","),
    ...df.data.map(processRow),
    ""
  ].join("\r\n")
}

function generateReadMe(pt: TSandsPoint, parc: SxplrParcellation, tmpl: SxplrTemplate){
  return `# Point assignment exporter

Exported by siibra-explorer verison \`${environment.VERSION}\` hash: \`${environment.GIT_HASH.trim()}\`.

On: ${new Date().toString()}

Data retrieved through siibra-api version \`${EXPECTED_SIIBRA_API_VERSION}\`

Retrieval parameters:

Point
- coord: ${pt.coordinates.map(v => v.value/1e6).join(',')} mm

Parcellation
- name: ${parc.name || parc.shortName}
- id: ${parc.id}

Space
- name: ${tmpl.name || tmpl.shortName}
- id: ${tmpl.id}
`
}
