import { animate, state, style, transition, trigger } from "@angular/animations";
import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, forkJoin, merge, Observable, Subject, Subscription } from "rxjs";
import { distinctUntilChanged, map, mapTo, shareReplay, switchMap, tap } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { atlasSelection } from "src/state";
import { fromRootStore } from "src/state/atlasSelection";
import { IQuickTourData } from "src/ui/quickTour";
import { ARIA_LABELS, CONST, QUICKTOUR_DESC } from 'common/constants'
import { MatMenuTrigger } from "@angular/material/menu";
import { SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi/type";

@Component({
  selector: `sxplr-sapiviews-core-atlas-tmplparcselector`,
  templateUrl: './tmplParcSelector.template.html',
  styleUrls: [
    `./tmplParcSelector.style.css`
  ],
  exportAs: 'sxplrSapiViewsCoreAtlasTmplparcselector',
  animations: [
    trigger('toggleAtlasLayerSelector', [
      state('false', style({
        transform: 'scale(0)',
        opacity: 0,
        transformOrigin: '0% 100%'
      })),
      state('true', style({
        transform: 'scale(1)',
        opacity: 1,
        transformOrigin: '0% 100%'
      })),
      transition('false => true', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ]),
      transition('true => false', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SapiViewsCoreAtlasAtlasTmplParcSelector {

  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  @ViewChildren(MatMenuTrigger)
  matMenuTriggers: QueryList<MatMenuTrigger>

  @ViewChild('selectorPanelTmpl', { read: ElementRef })
  selectorPanelTemplateRef: ElementRef

  private atp$ = this.store$.pipe(
    fromRootStore.distinctATP()
  )

  public availableParcellations$ = this.store$.pipe(
    fromRootStore.allAvailParcs(this.sapi),
    shareReplay(1),
  )

  public availableTemplates$ = this.store$.pipe(
    fromRootStore.allAvailSpaces(this.sapi),
  )

  public selectedTemplate$ = this.atp$.pipe(
    map(({ template }) => template)
  )

  public selectedParcellation$ = this.atp$.pipe(
    map(({ parcellation }) => parcellation)
  )

  public parcsAvailableInCurrentTmpl$: Observable<SapiParcellationModel[]> = combineLatest([
    this.atp$,
    this.availableParcellations$,
  ]).pipe(
    switchMap(([{ atlas, template }, parcs]) => 
      forkJoin(
        parcs.map(
          parc => this.sapi.getParcellation(atlas["@id"], parc["@id"]).getVolumes().pipe(
            map(
              volumes => {
                return {
                  parcellation: parc,
                  volumes
                }
              }
            )
          )
        )
      ).pipe(
        map(arr => 
          arr.filter(
            item => item.volumes.find(vol => vol.data.space["@id"] === template["@id"])
          ).map(
            ({ parcellation }) => parcellation
          )
        )
      )
    )
  )

  private showOverlayIntent$ = new Subject()
  public showLoadingOverlay$ = merge(
    this.showOverlayIntent$.pipe(
      mapTo(true)
    ),
    this.selectedTemplate$.pipe(
      mapTo(false)
    )
  ).pipe(
    distinctUntilChanged(),
  )

  private subscriptions: Subscription[] = []

  @HostBinding('attr.data-opened')
  public selectorExpanded: boolean = false

  public quickTourData: IQuickTourData = {
    order: 4,
    description: QUICKTOUR_DESC.LAYER_SELECTOR,
  }


  constructor(private store$: Store, private sapi: SAPI) {

  }
  ngOnDestroy() {
    while (this.subscriptions.length) this.subscriptions.pop().unsubscribe()
  }


  toggleSelector() {
    this.selectorExpanded = !this.selectorExpanded
  }

  closeSelector() {
    this.selectorExpanded = false
  }

  openSelector() {
    this.selectorExpanded = true
  }

  selectTemplate(tmpl: SapiSpaceModel) {
    this.showOverlayIntent$.next(true)

    this.store$.dispatch(
      atlasSelection.actions.selectTemplate({
        template: tmpl
      })
    )
  }

  selectParcellation(parc: SapiParcellationModel) {

    this.store$.dispatch(
      atlasSelection.actions.selectParcellation({
        parcellation: parc
      })
    )
  }

  collapseExpandedGroup() {
    this.matMenuTriggers.forEach(t => t.menuOpen && t.closeMenu())
  }


  trackbyAtId(t) {
    return t['@id']
  }

  trackKeyVal(obj: { key: string, value: any }) {
    return obj.key
  }
}