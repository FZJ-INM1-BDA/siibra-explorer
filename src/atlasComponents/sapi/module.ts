import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { DebugHttpInterceptor as _DebugHttpInterceptor, PriorityHttpInterceptor } from "src/util/priority";
import { AngularMaterialModule } from "src/sharedModules";
import { DARKTHEME } from "src/util/injectionTokens";
import { select, Store } from "@ngrx/store";
import { atlasSelection } from "src/state";
import { distinctUntilChanged, shareReplay, switchMap } from "rxjs/operators";
import { translateV3Entities } from "./translateV3";
import { MetaV1Schema } from "./volumeMeta";
import { IDS } from "./constants";
import { of } from "rxjs";

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    AngularMaterialModule,
  ],
  declarations: [
  ],
  exports: [
  ],
  providers: [
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: _DebugHttpInterceptor,
    //   multi: true
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: PriorityHttpInterceptor,
      multi: true
    },
    {
      provide: DARKTHEME,
      useFactory: (store: Store) => store.pipe(
        select(atlasSelection.selectors.selectedTemplate),
        distinctUntilChanged((o, n) => o?.id === n?.id),
        switchMap(tmpl => {
          if (!tmpl) {
            return of(false)
          }
          return translateV3Entities.translateSpaceToVolumeImageMeta(tmpl).then(
            imageMeta => {
              const mergedMeta = imageMeta.map(({ meta }) => meta || {} as MetaV1Schema).reduce((acc, curr) => ({ ...acc, ...curr }), {} as MetaV1Schema)
              let useTheme = mergedMeta?.["https://schema.brainatlas.eu/github/fzj-inm1-bda/siibra-explorer"]?.useTheme
              useTheme ||= (tmpl?.id === IDS.TEMPLATES.BIG_BRAIN ? 'light' : 'dark')
              return useTheme === "dark"
            }
          )
        }),
        shareReplay(1),
      ),
      deps: [ Store ]
    }
  ]
})
export class SAPIModule{}
