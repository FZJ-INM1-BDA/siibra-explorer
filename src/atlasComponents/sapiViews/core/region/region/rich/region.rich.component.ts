import { concat, Observable, of, Subject } from "rxjs";
import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { DARKTHEME } from "src/util/injectionTokens";
import { SapiViewsCoreRegionRegionBase } from "../region.base.directive";
import { ARIA_LABELS, CONST } from 'common/constants'
import { Feature } from "src/atlasComponents/sapi/sxplrTypes";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { environment } from "src/environments/environment";
import { catchError, map, shareReplay, switchMap } from "rxjs/operators";
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

  constructor(
    sapi: SAPI,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,
  ){
    super(sapi)
  }

  handleRegionalFeatureClicked(feat: Feature) {
    this.featureClicked.emit(feat)
  }

  activePanelTitles$: Observable<string[]> = new Subject()

  private regionalMaps$ = this.ATPR$.pipe(
    switchMap(({ parcellation, template, region }) =>
      concat(
        of([] as PathReturn<"/map">["volumes"]),
        this.sapi.getMap(parcellation.id, template.id, "STATISTICAL").pipe(
          map(v => {
            const mapIndices = v.indices[region.name]
            return mapIndices.map(mapIdx => v.volumes[mapIdx.volume])
          }),
          catchError((_err, _obs) => {
            /**
             * if statistical map somehow fails to fetch (e.g. does not exist for this combination 
             * of parc tmpl), fallback to labelled map
             */
            return this.sapi.getMap(parcellation.id, template.id, "LABELLED").pipe(
              map(v => {
                const mapIndices = v.indices[region.name]
                return mapIndices.map(mapIdx => v.volumes[mapIdx.volume])
              })
            )
          })
        ),
      )
    ),
    shareReplay(1)
  )

  public dois$ = this.regionalMaps$.pipe(
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

  public desc$ = this.regionalMaps$.pipe(
    map(sm => {
      for (const ds of (sm?.[0]?.datasets) || []) {
        if (ds.description) {
          return ds.description
        }
      }
    }),
  )
}
