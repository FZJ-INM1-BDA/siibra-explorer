import { Component, ElementRef, Inject, Optional, Output, inject } from "@angular/core";
import { Observable, Subject, merge } from "rxjs";
import { TSupportedViewers, TViewerEvent, isNehubaVCtxEvt, isThreeSurferVCtxEvt, isViewerCtx } from "../viewer.interface";
import { Store, select } from "@ngrx/store";
import { MainState, atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { distinctUntilChanged, filter, finalize, map, shareReplay, takeUntil } from "rxjs/operators";
import { arrayEqual } from "src/util/array";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, DragDropCallback, DragDropEv, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor, THoverConfig } from "src/util/injectionTokens";
import { SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { DragDropFileDirective } from "src/dragDropFile";
import { REGISTER_USER_DRAG_DROP } from "src/util/injectionTokens"

@Component({
  selector: 'viewer-wrapper',
  templateUrl: './viewerWrapper.template.html',
  styleUrls: [
    './viewerWrapper.style.css'
  ],
  hostDirectives: [
    DestroyDirective,
    DragDropFileDirective,
  ]
})
export class ViewerWrapper {
  
  #destroy$ = inject(DestroyDirective).destroyed$
  #onFileDrop$ = inject(DragDropFileDirective).dragDropOnDrop

  @Output('viewer-event')
  viewerEvent$ = new Subject<
    TViewerEvent
  >()

  selectedAtlas$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedAtlas)
  )

  useViewer$: Observable<TSupportedViewers | 'notsupported'> = this.store$.pipe(
    select(atlasAppearance.selectors.useViewer),
    map(useviewer => {
      if (useviewer === "NEHUBA") return "nehuba"
      if (useviewer === "THREESURFER") return "threeSurfer"
      if (useviewer === "NOT_SUPPORTED") return "notsupported"
      return null
    })
  )

  constructor(
    el: ElementRef,
    private store$: Store<MainState>,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR)
    hoverInterceptor: HoverInterceptor,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR)
    clickInterceptor: ClickInterceptor,
  ){

    this.store$.pipe(
      select(atlasSelection.selectors.selectedTemplate),
      takeUntil(this.#destroy$)
    ).subscribe(tmpl => {
      this.#selectedTemplate = tmpl
    })

    const dndCbs = inject(REGISTER_USER_DRAG_DROP) as DragDropCallback[]

    this.#onFileDrop$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(files => {
      const payload: DragDropEv = typeof files === "string"
      ? { type : "text", payload: { input: files }}
      : { type: "file", payload: { files } }
      for (const callback of dndCbs){
        callback(payload)
      }
    })

    /**
     * handling nehuba event
     */
    this.#nehubaViewerCtxEv$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(ev => {
      const { nehuba, nav } = ev.data.payload
      if (nehuba) {
        const mousingOverRegions = (nehuba || []).reduce((acc, { regions }) => acc.concat(...regions), [])
        this.store$.dispatch(
          userInteraction.actions.mouseoverRegions({
            regions: mousingOverRegions
          })
        )
      }
      if (nav) {
        this.store$.dispatch(
          userInteraction.actions.mouseoverPosition({
            position: {
              loc: nav.position as [number, number, number],
              space: this.#selectedTemplate,
              spaceId: this.#selectedTemplate.id,
            }
          })
        )
      }
    })

    /**
     * handling threesurfer event
     */
    this.#threeSurferViewerCtxEv$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(ev => {
      const { regions = [] } = ev.data.payload
      this.store$.dispatch(
        userInteraction.actions.mouseoverRegions({
          regions: regions as SxplrRegion[]
        })
      )
    })

    if (hoverInterceptor) {
      let hoverRegionMessages: THoverConfig[] = []
      const { append, remove } = hoverInterceptor
      this.#hoveredRegions$.pipe(
        takeUntil(this.#destroy$),
        finalize(() => {
          for (const msg of hoverRegionMessages) {
            remove(msg)
          }
        })
      ).subscribe(regions => {
        
        for (const msg of hoverRegionMessages) {
          remove(msg)
        }

        hoverRegionMessages = regions.map(region => ({
          message: region.name || 'Unknown Region',
          fontIcon: 'fa-brain',
          fontSet: 'fas'
        }))

        for (const msg of hoverRegionMessages){
          append(msg)
        }
      })
    }

    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      let hoveredRegions: SxplrRegion[]
      this.#hoveredRegions$.subscribe(reg => {
        hoveredRegions = reg as SxplrRegion[]
      })
      const handleClick = (ev: PointerEvent) => {
        if (!el?.nativeElement?.contains(ev.target)) {
          return true
        }
        if ((hoveredRegions || []).length === 0) {
          return true
        }
        if (ev.ctrlKey) {
          this.store$.dispatch(
            atlasSelection.actions.toggleRegion({
              region: hoveredRegions[0]
            })
          )
        } else {
          this.store$.dispatch(
            atlasSelection.actions.selectRegion({
              region: hoveredRegions[0]
            })
          )
        }
        return true
      }
      register(handleClick, { last: true })
      this.#destroy$.subscribe(() => {
        deregister(handleClick)
      })
    }
  }

  public handleViewerEvent(event: TViewerEvent): void{
    this.viewerEvent$.next(event)
  }
  
  #viewerCtxEvent$ = this.viewerEvent$.pipe(
    filter(isViewerCtx),
    shareReplay(1),
  )

  #nehubaViewerCtxEv$ = this.#viewerCtxEvent$.pipe(
    filter(isNehubaVCtxEvt)
  )

  #threeSurferViewerCtxEv$ = this.#viewerCtxEvent$.pipe(
    filter(isThreeSurferVCtxEvt)
  )

  #hoveredRegions$ = merge(
    this.#nehubaViewerCtxEv$.pipe(
      filter(ev => !!ev.data.payload.nehuba),
      map(ev => {
        const { nehuba } = ev.data.payload
        return nehuba.map(n => n.regions).flatMap(v => v)
      })
    ),
    this.#threeSurferViewerCtxEv$.pipe(
      map(ev => {
        const { regions = [] } = ev.data.payload
        return regions
      })
    )
  ).pipe(
    distinctUntilChanged(
      arrayEqual((o, n) => o.name === n.name)
    )
  )
  
  #selectedTemplate: SxplrTemplate = null
}
