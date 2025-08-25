import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Inject, Input, Optional } from "@angular/core";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { AngularMaterialModule } from "src/sharedModules";
import { MarkdownModule } from "../markdown";
import { BehaviorSubject, EMPTY, Observable } from "rxjs";
import { map, shareReplay, switchMap } from "rxjs/operators";

export type SxplrSnackBarCfg = {
  message: string
  useMarkdown?: boolean
  icon?: string
  maticon?: string
}

@Component({
  selector: `sxplr-snackbox`,
  templateUrl: `./snackDialog.template.html`,
  styleUrls: [
    './snackDialog.style.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    MarkdownModule,
  ]
})

export class SxplrSnackDialogCmp {

  @Input()
  message: string

  @Input()
  useMarkdown: boolean = false

  @Input()
  icon: string

  @Input()
  maticon: string

  useObs = false

  #data$: Observable<SxplrSnackBarCfg[]>
  svcIndex$ = new BehaviorSubject(0)

  constructor(
    @Optional()
    @Inject(MAT_SNACK_BAR_DATA)
    data: SxplrSnackBarCfg&{cfgs$?:Observable<SxplrSnackBarCfg[]>},
    private snackRef: MatSnackBarRef<SxplrSnackDialogCmp>,
  ){
    if (data.cfgs$) {
      this.useObs = true
      this.#data$ = data.cfgs$
      return
    }
    if (data) {
      this.message = data.message
      this.useMarkdown = data.useMarkdown
      this.icon = data.icon
      this.maticon = data.maticon
      return
    }
  }

  #indexedData$ = this.svcIndex$.pipe(
    switchMap(idx => (this.#data$ || EMPTY).pipe(
      map(data => ({idx, data}))
    )),
    shareReplay(1),
  )

  dataView$ = this.#indexedData$.pipe(
    map(({ idx, data }) => {
      return {
        idx,
        data,
        dismissBadge: data.length - idx > 1 ? data.length - idx : null
      }
    })
  )

  data$ = this.#indexedData$.pipe(
    map(({ idx, data }) => data.slice(idx))
  )

  dismissWithAction(){
    this.snackRef.dismissWithAction()
  }

  setIndex(idx: number){
    this.svcIndex$.next(idx)
  }
}
