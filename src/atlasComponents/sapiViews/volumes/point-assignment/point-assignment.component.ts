import { Component, Input, OnDestroy, Output, TemplateRef, EventEmitter } from '@angular/core';
import { Clipboard, MatDialog, MatDialogRef, MatSnackBar } from 'src/sharedModules/angularMaterial.exports';
import { BehaviorSubject, EMPTY, Observable, Subscription, combineLatest, concat, of } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SAPI, EXPECTED_SIIBRA_API_VERSION } from 'src/atlasComponents/sapi/sapi.service';
import { SxplrParcellation, SxplrTemplate } from 'src/atlasComponents/sapi/sxplrTypes';
import { translateRegionName } from 'src/atlasComponents/sapi/translateV3';
import { PathReturn } from 'src/atlasComponents/sapi/typeV3';
import { TFace, TSandsPoint } from 'src/util/types';
import { TZipFileConfig } from "src/zipFilesOutput/type"
import { environment } from "src/environments/environment"
import { Store } from '@ngrx/store';
import { atlasSelection } from 'src/state';

const DOING_PROB_ASGMT = "Performing probabilistic assignment ..."
const DOING_LABEL_ASGMT = "Probabilistic assignment failed. Performing labelled assignment ..."

const LABELLED_MAP_ASSIGNMENT_REGRESSION = `Labelled point assignment is currently experiencing some regression. For more detail, please visit

[https://siibra-explorer.readthedocs.io/en/stable/releases/v2.14.11/](https://siibra-explorer.readthedocs.io/en/stable/releases/v2.14.11/)`

@Component({
  selector: 'sxplr-point-assignment',
  templateUrl: './point-assignment.component.html',
  styleUrls: ['./point-assignment.component.scss']
})
export class PointAssignmentComponent implements OnDestroy {

  SIMPLE_COLUMNS = [
    "regionname",
    "map_value",
  ]
  
  #busy$ = new BehaviorSubject<string>(null)
  busy$ = this.#busy$.asObservable()

  #error$ = new BehaviorSubject<string>(null)
  error$ = this.#error$.asObservable()

  point$ = new BehaviorSubject<TSandsPoint>(null)
  @Input()
  set point(val: TSandsPoint|TFace) {
    const { '@type': type } = val
    if (type === "siibra-explorer/surface/face") {
      return
    }
    this.point$.next(val)
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
  clickOnRegionName = new EventEmitter<{ target: string, event: MouseEvent }>()

  warningMessage$ = this.busy$.pipe(
    filter(busyWith => !!busyWith),
    map(busyWith => busyWith === DOING_LABEL_ASGMT && LABELLED_MAP_ASSIGNMENT_REGRESSION)
  )

  df$: Observable<PathReturn<"/map/assign">> = combineLatest([
    this.point$,
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

  constructor(private sapi: SAPI, private dialog: MatDialog,
    private store: Store,
    private clipboard: Clipboard,
    private snackbar: MatSnackBar) {}

  #dialogRef: MatDialogRef<unknown>
  openDialog(tmpl: TemplateRef<unknown>){
    this.#dialogRef = this.dialog.open(tmpl)
    this.#dialogRef.afterClosed().subscribe(() => {
      this.#dialogRef = null
    })
  }

  #sub: Subscription[] = []
  ngOnDestroy(): void {
    while (this.#sub.length > 0) this.#sub.pop().unsubscribe()
  }
  selectRegion(regionName: string, event: MouseEvent){
    this.clickOnRegionName.emit({ target: translateRegionName(regionName), event })
    if (this.#dialogRef) {
      this.#dialogRef.close()
    }
  }

  zipfileConfig$: Observable<TZipFileConfig[]> = combineLatest([
    this.point$,
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

  navigateToPoint(coordsInMm: number[]){
    this.store.dispatch(
      atlasSelection.actions.navigateTo({
        animation: true,
        navigation: {
          position: coordsInMm.map(v => v * 1e6)
        }
      })
    )
  }
  
  copyCoord(coord: number[]){
    const strToCopy = coord.map(v => `${v.toFixed(2)}mm`).join(', ')
    this.clipboard.copy(strToCopy)
    this.snackbar.open(`Copied to clipboard`, 'Dismiss', {
      duration: 4000
    })
  }
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
  ].join("\r\n")
}
