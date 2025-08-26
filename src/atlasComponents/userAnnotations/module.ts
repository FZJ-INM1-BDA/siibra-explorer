import { APP_INITIALIZER, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "src/sharedModules";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { UserAnnotationToolModule } from "./tools/module";
import { UtilModule } from "src/util";
import { SingleAnnotationClsIconPipe, SingleAnnotationNamePipe, SingleAnnotationUnit } from "./singleAnnotationUnit/singleAnnotationUnit.component";
import { AnnotationVisiblePipe } from "./annotationVisible.pipe";
import { FileInputModule } from "src/getFileInput/module";
import { ZipFilesOutputModule } from "src/zipFilesOutput/module";
import { FilterAnnotationsBySpace } from "./filterAnnotationBySpace.pipe";
import { ShareModule } from "src/share";
import { StateModule } from "src/state";
import { RoutedAnnotationService } from "./routedAnnotation.service";
import { INIT_ROUTE_TO_STATE } from "src/util/injectionTokens";
import { Router } from "@angular/router";
import { DECODE_ENCODE, DecodeEncode } from "src/routerModule/util";
import { userAnnotationRouteKey } from "./constants";
import { ModularUserAnnotationToolService } from "./tools/service";
import { SimpleAnnotationList } from "./simpleAnnotList/simpleAnnotList.component";
import { SxplrAnnotToolsDirective } from "./directives/annotationTools.directive";

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
    SingleAnnotationUnit,
    SingleAnnotationNamePipe,
    SingleAnnotationClsIconPipe,
    AnnotationVisiblePipe,
    FilterAnnotationsBySpace,
    SimpleAnnotationList,
    SxplrAnnotToolsDirective,
  ],
  exports: [
    SimpleAnnotationList,
    SxplrAnnotToolsDirective,
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
      useFactory: (router: Router, decodeCustomState: DecodeEncode, annSvc: ModularUserAnnotationToolService) => {
        return async (fullPath: string) => {
          const customState = decodeCustomState.decodeCustomState(
            router.parseUrl(fullPath)
          ) || {}
          if (userAnnotationRouteKey in customState) {
            annSvc.focus()
          }
          return Promise.resolve({})
        }
      },
      deps: [Router, DECODE_ENCODE, ModularUserAnnotationToolService],
      multi: true
    }
  ]
})

export class UserAnnotationsModule{}
