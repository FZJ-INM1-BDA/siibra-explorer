import { Component, Input, OnDestroy, Output, TemplateRef, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, EMPTY, Observable, Subscription, combineLatest, concat, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SAPI, EXPECTED_SIIBRA_API_VERSION } from 'src/atlasComponents/sapi/sapi.service';
import { SxplrParcellation, SxplrRegion, SxplrTemplate } from 'src/atlasComponents/sapi/sxplrTypes';
import { translateV3Entities } from 'src/atlasComponents/sapi/translateV3';
import { PathReturn } from 'src/atlasComponents/sapi/typeV3';
import { TSandsPoint } from 'src/util/types';
import { TZipFileConfig } from "src/zipFilesOutput/type"
import { environment } from "src/environments/environment"

const DOING_PROB_ASGMT = "Performing probabilistic assignment ..."
const DOING_LABEL_ASGMT = "Probabilistic assignment failed. Performing labelled assignment ..."

@Component({
  selector: 'sxplr-point-assignment',
  templateUrl: './point-assignment.component.html',
  styleUrls: ['./point-assignment.component.scss']
})
export class PointAssignmentComponent implements OnDestroy {

  SIMPLE_COLUMNS = [
    "region",
    "map value",
  ]
  
  #busy$ = new BehaviorSubject<string>(null)
  busy$ = this.#busy$.asObservable()

  #error$ = new BehaviorSubject<string>(null)
  error$ = this.#error$.asObservable()

  #point = new BehaviorSubject<TSandsPoint>(null)
  @Input()
  set point(val: TSandsPoint) {
    this.#point.next(val)
  }
  
  #template = new BehaviorSubject<SxplrTemplate>(null)
  @Input()
  set template(val: SxplrTemplate) {
    this.#template.next(val)
  }

  #parcellation = new BehaviorSubject<SxplrParcellation>(null)
  @Input()
  set parcellation(val: SxplrParcellation) {
    this.#parcellation.next(val)
  }

  @Output()
  clickOnRegion = new EventEmitter<{ target: SxplrRegion, event: MouseEvent }>()

  df$: Observable<PathReturn<"/map/assign">> = combineLatest([
    this.#point,
    this.#parcellation,
    this.#template,
  ]).pipe(
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
            })
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

  constructor(private sapi: SAPI, private dialog: MatDialog) {}

  openDialog(tmpl: TemplateRef<unknown>){
    this.dialog.open(tmpl)
  }

  #sub: Subscription[] = []
  ngOnDestroy(): void {
    while (this.#sub.length > 0) this.#sub.pop().unsubscribe()
  }
  async selectRegion(region: PathReturn<"/regions/{region_id}">, event: MouseEvent){
    const sxplrReg = await translateV3Entities.translateRegion(region)
    this.clickOnRegion.emit({ target: sxplrReg, event })
  }

  zipfileConfig$: Observable<TZipFileConfig[]> = combineLatest([
    this.#point,
    this.#parcellation,
    this.#template,
    this.df$
  ]).pipe(
    map(([ pt, parc, tmpl, df ]) => {
      return [{
        filename: 'README.md',
        filecontent: generateReadMe(pt, parc, tmpl)
      }, {
        filename: 'pointassignment.csv',
        filecontent: generateCsv(df)
      }] as TZipFileConfig[]
    })
  )
}

function generateReadMe(pt: TSandsPoint, parc: SxplrParcellation, tmpl: SxplrTemplate){
  return `# Point assignment exporter

Exported by siibra-explorer verison \`${environment.VERSION}\` hash: \`${environment.GIT_HASH}\`.

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

function escapeFactory(chars: string[] = []){
  const search = new RegExp(`[${chars.join('').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g')
  return function escape(s: string) {
    return s.replace(search, s => `\\${s}`)
  }
}

const escapeDoubleQuotes = escapeFactory(['"'])

function processRow(v: unknown[]): string{
  const returnValue: string[] = []
  for (const item of v) {

    // region
    if (typeof item === "object" && item?.['@type'] === "siibra-0.4/region") {
      returnValue.push(item['name'])
      continue
    }

    returnValue.push(JSON.stringify(item))
  }
  return returnValue.map(escapeDoubleQuotes).map(v => `"${v}"`).join(",")
}

function generateCsv(df: PathReturn<"/map/assign">) {
  return [
    df.columns.map(escapeDoubleQuotes).map(v => `"${v}"`).join(","),
    ...df.data.map(processRow)
  ].join("\n")
}
