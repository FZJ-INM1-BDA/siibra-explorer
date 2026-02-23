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
import { REGISTER_USER_DRAG_DROP, DragDropCallback } from "src/util/injectionTokens"
import { ModularUserAnnotationToolService } from "./tools/service";
import { unzip } from "src/zipFilesOutput/zipFilesOutput.directive";
import { DialogModule } from "src/ui/dialogInfo";

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
    DialogModule
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
  ],
  exports: [
    AnnotationMode,
    AnnotationList,
    AnnotationSwitch,
    AnnotationEventDirective
  ],
  providers: [
    // initialize routerannotation service, so it will parse route and load annotations ...
    // ... in url correctly
    {
      provide: APP_INITIALIZER,
      useFactory: (_svc: RoutedAnnotationService) => {
        return () => Promise.resolve()
      },
      deps: [RoutedAnnotationService],
      multi: true
    },
    {
      provide: REGISTER_USER_DRAG_DROP,
      useFactory: (annotSvc: ModularUserAnnotationToolService) => {
        const cb: DragDropCallback = async ev => {
          if (ev.type !== "text") {
            return
          }
          try {
            const json = JSON.parse(ev.payload.input)

            const annot = annotSvc.parseAnnotationObject(json)
            if (annot) {
              annotSvc.importAnnotation(annot)
              annotSvc.remark()
            }
          } catch (e) {
            return
          }

        }
        return cb
      },
      multi: true,
      deps: [ModularUserAnnotationToolService]
    },
    {
      provide: REGISTER_USER_DRAG_DROP,
      useFactory: (annotSvc: ModularUserAnnotationToolService) => {
        const cb: DragDropCallback = async ev => {
          if (ev.type !== "file") {
            return
          }

          const files = ev.payload.files
          if (files.length === 0) {
            console.error(`UserAnnotationModule: Need at least one file.`)
            return
          }
          if (files.length > 1) {
            console.error(`UserAnnotationModule: parsing multiple files are not yet supported`)
            return
          }
          const file = files[0]
          const isJson = /\.json$/.test(file.name)
          const isZip = /\.zip$/.test(file.name)
          if (isZip) {
            const files = await unzip(file)
            const sands = files.filter(f => /\.json$/.test(f.filename))
            for (const sand of sands) {
              const annotation = annotSvc.parseAnnotationString(sand.filecontent)
              if (annotation) {
                annotSvc.importAnnotation(annotation)
                annotSvc.remark()
              }
            }
          }
          if (isJson) {
            const reader = new FileReader()
            reader.onload = evt => {
              const out = evt.target.result
              const annotation = annotSvc.parseAnnotationString(out as string)
              if (annotation) {
                annotSvc.importAnnotation(annotation)
                annotSvc.remark()
              }
            }
            reader.onerror = e => { throw e }
            reader.readAsText(file, 'utf-8')
          }
        }
        return cb
      },
      multi: true,
      deps: [ModularUserAnnotationToolService]
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

export class UserAnnotationsModule { }
