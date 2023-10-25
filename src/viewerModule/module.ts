import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { Observable, combineLatest, of, throwError } from "rxjs";
import { ComponentsModule } from "src/components";
import { ContextMenuModule, ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from "src/sharedModules";
import { TopMenuModule } from "src/ui/topMenu/module";
import { CONTEXT_MENU_ITEM_INJECTOR, TContextMenu, UtilModule } from "src/util";
import { NehubaModule, NehubaViewerUnit } from "./nehuba";
import { ThreeSurferModule } from "./threeSurfer";
import { ViewerCmp } from "./viewerCmp/viewerCmp.component";
import { UserAnnotationsModule } from "src/atlasComponents/userAnnotations";
import { QuickTourModule } from "src/ui/quickTour/module";
import { INJ_ANNOT_TARGET } from "src/atlasComponents/userAnnotations/tools/type";
import { NEHUBA_INSTANCE_INJTKN } from "./nehuba/util";
import { map, switchMap } from "rxjs/operators";
import { TContextArg } from "./viewer.interface";
import { KeyFrameModule } from "src/keyframesModule/module";
import { ViewerInternalStateSvc } from "./viewerInternalState.service";
import { SAPI, SAPIModule } from 'src/atlasComponents/sapi';
import { NehubaVCtxToBbox } from "./pipes/nehubaVCtxToBbox.pipe";
import { SapiViewsModule, SapiViewsUtilModule } from "src/atlasComponents/sapiViews";
import { DialogModule } from "src/ui/dialogInfo/module";
import { MouseoverModule } from "src/mouseoverModule";
import { LogoContainer } from "src/ui/logoContainer/logoContainer.component";
import { FloatingMouseContextualContainerDirective } from "src/util/directives/floatingMouseContextualContainer.directive";
import { ShareModule } from "src/share";
import { LeapModule } from "./leap/module";

import { environment } from "src/environments/environment"
import { ATPSelectorModule } from "src/atlasComponents/sapiViews/core/rich/ATPSelector";
import { FeatureModule } from "src/features";
import { NgLayerCtlModule } from "./nehuba/ngLayerCtlModule/module";
import { SmartChipModule } from "src/components/smartChip";
import { ReactiveFormsModule } from "@angular/forms";
import { BottomMenuModule } from "src/ui/bottomMenu";
import { CURRENT_TEMPLATE_DIM_INFO, TemplateInfo, Z_TRAVERSAL_MULTIPLIER } from "./nehuba/layerCtrl.service/layerCtrl.util";
import { Store } from "@ngrx/store";
import { atlasSelection, userPreference } from "src/state";

@NgModule({
  imports: [
    CommonModule,
    NehubaModule,
    ThreeSurferModule,
    LayoutModule,
    AngularMaterialModule,
    TopMenuModule,
    UtilModule,
    ComponentsModule,
    UserAnnotationsModule,
    QuickTourModule,
    ContextMenuModule,
    KeyFrameModule,
    SAPIModule,
    SapiViewsModule,
    SapiViewsUtilModule,
    DialogModule,
    MouseoverModule,
    ShareModule,
    ATPSelectorModule,
    FeatureModule,
    NgLayerCtlModule,
    SmartChipModule,
    ReactiveFormsModule,
    BottomMenuModule,
    ...(environment.ENABLE_LEAP_MOTION ? [LeapModule] : [])
  ],
  declarations: [
    ViewerCmp,
    NehubaVCtxToBbox,
    LogoContainer,
    FloatingMouseContextualContainerDirective,
  ],
  providers: [
    {
      provide: INJ_ANNOT_TARGET,
      useFactory: (obs$: Observable<NehubaViewerUnit>) => {
        return obs$.pipe(
          map(unit => unit?.elementRef?.nativeElement)
        )
      },
      deps: [
        NEHUBA_INSTANCE_INJTKN
      ]
    },
    {
      provide: CONTEXT_MENU_ITEM_INJECTOR,
      useFactory: (svc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>) => {
        return {
          register: svc.register.bind(svc),
          deregister: svc.deregister.bind(svc)
        } as TContextMenu<TContextMenuReg<TContextArg<'nehuba' | 'threeSurfer'>>>
      },
      deps: [ ContextMenuService ]
    },
    ViewerInternalStateSvc,
    
    {
      provide: Z_TRAVERSAL_MULTIPLIER,
      useFactory: (store: Store, templateInfo: Observable<TemplateInfo>) => {
        return combineLatest([
          store.select(userPreference.selectors.overrideZTraversalMultiplier),
          templateInfo
        ]).pipe(
          map(([ override, tmplInfo ]) => override || tmplInfo.resolution?.[0] || 1e3)
        )
      },
      deps: [ Store, CURRENT_TEMPLATE_DIM_INFO ]
    },
    {
      provide: CURRENT_TEMPLATE_DIM_INFO,
      useFactory: (store: Store, sapi: SAPI) => store.pipe(
        atlasSelection.fromRootStore.distinctATP(),
        switchMap(({ template }) =>
          template
          ? sapi.getVoxelTemplateImage(template).pipe(
            switchMap(defaultImage => {
              if (defaultImage.length === 0) {
                return of(null)
              }
              const img = defaultImage[0]
              if (img.legacySpecFlag === "new") {
                return throwError('new spec for template is not supported yet.')
              }
              return of({
                ...img.info || {},
                transform: img.transform
              })
            })
          )
          : of(null)
        )
      ),
      deps: [ Store, SAPI ]
    },
  ],
  exports: [
    ViewerCmp,
  ],
})

export class ViewerModule{}
