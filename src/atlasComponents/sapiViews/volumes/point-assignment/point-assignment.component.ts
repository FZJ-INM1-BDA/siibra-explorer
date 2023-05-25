import { Component, Input, OnDestroy, Output, TemplateRef, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, EMPTY, Subscription, combineLatest, concat, of } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { SxplrParcellation, SxplrRegion, SxplrTemplate } from 'src/atlasComponents/sapi/sxplrTypes';
import { translateV3Entities } from 'src/atlasComponents/sapi/translateV3';
import { PathReturn } from 'src/atlasComponents/sapi/typeV3';
import { TSandsPoint } from 'src/util/types';

@Component({
  selector: 'sxplr-point-assignment',
  templateUrl: './point-assignment.component.html',
  styleUrls: ['./point-assignment.component.scss']
})
export class PointAssignmentComponent implements OnDestroy {

  SIMPLE_COLUMNS = [
    "region",
    "intersection over union",
  ]
  
  #busy$ = new BehaviorSubject(false)
  busy$ = this.#busy$.asObservable()

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

  df$ = combineLatest([
    this.#point,
    this.#parcellation,
    this.#template,
  ]).pipe(
    switchMap(([ point, parcellation, template ]) => {
      if (!point || !parcellation || !template) {
        return EMPTY
      }
      const { ['@id']: ptSpaceId} = point.coordinateSpace
      if (ptSpaceId !== template.id) {
        console.warn(`point coordination space id ${ptSpaceId} is not the same as template id ${template.id}.`)
        return EMPTY
      }
      this.#busy$.next(true)
      return concat(
        of(null),
        this.sapi.v3Get("/map/assign", {
          query: {
            parcellation_id: parcellation.id,
            point: point.coordinates.map(v => `${v.value/1e6}mm`).join(','),
            space_id: template.id,
            sigma_mm: 3.0
          }
        }).pipe(
          tap(() => this.#busy$.next(false)),
        )
      ).pipe(
        shareReplay(1),
      )
    })
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
}
