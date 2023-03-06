import { concat, Observable, of, Subject } from "rxjs";
import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { DARKTHEME } from "src/util/injectionTokens";
import { SapiViewsCoreRegionRegionBase } from "../region.base.directive";
import { ARIA_LABELS, CONST } from 'common/constants'
import { Feature } from "src/atlasComponents/sapi/sxplrTypes";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { environment } from "src/environments/environment";
import { map, shareReplay, switchMap } from "rxjs/operators";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";

@Component({
  selector: 'sxplr-sapiviews-core-region-region-rich',
  templateUrl: './region.rich.template.html',
  styleUrls: [
    `./region.rich.style.css`
  ],
  exportAs: "sapiViewsCoreRegionRich"
})

export class SapiViewsCoreRegionRegionRich extends SapiViewsCoreRegionRegionBase {
  
  public environment = environment
  public shouldFetchDetail = true
  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  @Output('sxplr-sapiviews-core-region-region-rich-feature-clicked')
  featureClicked = new EventEmitter<Feature>()

  public expandedPanel: string

  constructor(
    sapi: SAPI,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,
  ){
    super(sapi)
  }

  handleRegionalFeatureClicked(feat: Feature) {
    this.featureClicked.emit(feat)
  }

  // eslint-disable-next-line  @typescript-eslint/no-empty-function
  handleExpansionPanelClosedEv(title: string){
    this.expandedPanel = null
  }

  // eslint-disable-next-line  @typescript-eslint/no-empty-function
  handleExpansionPanelAfterExpandEv(title: string) {
    this.expandedPanel = title
  }

  activePanelTitles$: Observable<string[]> = new Subject()

  private regionalStatisticalMaps$ = this.ATPR$.pipe(
    switchMap(({ parcellation, template, region }) =>
      concat(
        of([] as PathReturn<"/map">["volumes"]),
        this.sapi.getMap(parcellation.id, template.id, "STATISTICAL").pipe(
          map(v => {
            const mapIndices = v.indices[region.name]
            return mapIndices.map(mapIdx => v.volumes[mapIdx.volume])
          })
        )
      )
    ),
    shareReplay(1)
  )

  public dois$ = this.regionalStatisticalMaps$.pipe(
    map(sms => {
      const returnUrls: string[] = []
      for (const sm of sms) {
        for (const ds of sm.datasets) {
          for (const url of ds.urls) {
            returnUrls.push(url.url)
          }
          
        }
      }
      return returnUrls
    })
  )

  public desc$ = this.regionalStatisticalMaps$.pipe(
    map(sm => {
      for (const ds of (sm?.[0]?.datasets) || []) {
        if (ds.description) {
          return ds.description
        }
      }
    }),
  )
}
