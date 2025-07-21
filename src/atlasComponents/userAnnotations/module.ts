import { APP_INITIALIZER, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "src/sharedModules";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AnnotationMode } from "src/atlasComponents/userAnnotations/annotationMode/annotationMode.component";
import { AnnotationList } from "src/atlasComponents/userAnnotations/annotationList/annotationList.component";
import { UserAnnotationToolModule } from "./tools/module";
import { AnnotationSwitch } from "src/atlasComponents/userAnnotations/directives/annotationSwitch.directive";
import { UtilModule } from "src/util";
import { SingleAnnotationClsIconPipe, SingleAnnotationNamePipe, SingleAnnotationUnit } from "./singleAnnotationUnit/singleAnnotationUnit.component";
import { AnnotationVisiblePipe } from "./annotationVisible.pipe";
import { FileInputModule } from "src/getFileInput/module";
import { ZipFilesOutputModule } from "src/zipFilesOutput/module";
import { FilterAnnotationsBySpace } from "./filterAnnotationBySpace.pipe";
import { AnnotationEventDirective } from "./directives/annotationEv.directive";
import { ShareModule } from "src/share";
import { MainState, StateModule } from "src/state";
import { RoutedAnnotationService } from "./routedAnnotation.service";
import { INIT_ROUTE_TO_STATE } from "src/util/injectionTokens";
import { Router } from "@angular/router";
import { DECODE_ENCODE, DecodeEncode } from "src/routerModule/util";
import { userAnnotationRouteKey } from "./constants";
import { RecursivePartial } from "src/util/recursivePartial";
import { ModularUserAnnotationToolService } from "./tools/service";
import { AnnotationListDirective } from "./directives/annotation.directive";
import { SimpleAnnotationList } from "./simpleAnnotList/simpleAnnotList.component";

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    UserAnnotationToolModule,
    UtilModule,
    FileInputModule,
    ZipFilesOutputModule,
    ShareModule,
    StateModule,
  ],
  declarations: [
    AnnotationMode,
    AnnotationList,
    AnnotationSwitch,
    SingleAnnotationUnit,
    SingleAnnotationNamePipe,
    SingleAnnotationClsIconPipe,
    AnnotationVisiblePipe,
    FilterAnnotationsBySpace,
    AnnotationEventDirective,
    AnnotationListDirective,
    SimpleAnnotationList,
  ],
  exports: [
    AnnotationMode,
    AnnotationList,
    AnnotationSwitch,
    AnnotationEventDirective,
    AnnotationListDirective,
    SimpleAnnotationList,
  ],
  providers: [
    // initialize routerannotation service, so it will parse route and load annotations ...
    // ... in url correctly
    {
      provide: APP_INITIALIZER,
      useFactory:(_svc: RoutedAnnotationService, annSvc: ModularUserAnnotationToolService) => {
        annSvc.loadStoredAnnotations().catch(e => {
          console.error(`Loading annotation error: ${e}`)
        })
        return () => Promise.resolve()
      },
      deps: [ RoutedAnnotationService, ModularUserAnnotationToolService ],
      multi: true
    },
    {
      provide: INIT_ROUTE_TO_STATE,
      useFactory: (router: Router, decodeCustomState: DecodeEncode) => {
        return async (fullPath: string) => {
          const customState = decodeCustomState.decodeCustomState(
            router.parseUrl(fullPath)
          ) || {}
          if (userAnnotationRouteKey in customState) {
            const partial: RecursivePartial<MainState> = {
              "[state.atlasSelection]": {
                viewerMode: "annotating"
              }
            }
            return Promise.resolve(partial)
          }
          return Promise.resolve({})
        }
      },
      deps: [Router, DECODE_ENCODE],
      multi: true
    }
  ]
})

export class UserAnnotationsModule{}
