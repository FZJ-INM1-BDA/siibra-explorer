import { ComponentFixture, TestBed } from "@angular/core/testing"
import { AnnotationList } from "./annotationList.component"
import { FileInputModule } from "src/getFileInput/module"
import { CommonModule } from "@angular/common"
import { ModularUserAnnotationToolService } from "../tools/service"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { MatDialogModule } from "@angular/material/dialog"
import { ComponentStore } from "@ngrx/component-store"
import { NEVER, of } from "rxjs"
import { MatSnackBarModule } from "@angular/material/snack-bar"
import { StateModule } from "src/state"
import { hot } from "jasmine-marbles"
import { IAnnotationGeometry } from "../tools/type"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatButtonModule } from "@angular/material/button"
import { MatCardModule } from "@angular/material/card"
import { ZipFilesOutputModule } from "src/zipFilesOutput/module"
import { AnnotationVisiblePipe } from "../annotationVisible.pipe"
import { SingleAnnotationClsIconPipe, SingleAnnotationNamePipe } from "../singleAnnotationUnit/singleAnnotationUnit.component"
import { MatExpansionModule } from "@angular/material/expansion"

class MockModularUserAnnotationToolService {
  hiddenAnnotations$ = of([])
  toggleAnnotationVisibilityById = jasmine.createSpy()
  parseAnnotationObject = jasmine.createSpy()
  importAnnotation = jasmine.createSpy()
  spaceFilteredManagedAnnotations$ = NEVER
  rSpaceManagedAnnotations$ = NEVER
  otherSpaceManagedAnnotations$ = NEVER
}

const readmeContent = `{id}.sands.json file contains the data of annotations. {id}.desc.json contains the metadata of annotations.`

describe("annotationList.component.ts", () => {
  let component: AnnotationList;
  let fixture: ComponentFixture<AnnotationList>;

  describe("AnnotationList", () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          CommonModule,
          FileInputModule,
          NoopAnimationsModule,
          MatDialogModule,
          MatSnackBarModule,
          StateModule, // needed for iavStateAggregator directive
          MatTooltipModule,
          MatButtonModule,
          MatCardModule,
          MatExpansionModule,
          ZipFilesOutputModule,
        ],
        providers: [
          ComponentStore,
          {
            provide: ModularUserAnnotationToolService,
            useClass: MockModularUserAnnotationToolService
          }
        ],
        declarations: [
          AnnotationList,
          AnnotationVisiblePipe,
          SingleAnnotationNamePipe,
          SingleAnnotationClsIconPipe,
        ]
      }).compileComponents()
    })
    it("> can be init", () => {
      
      fixture = TestBed.createComponent(AnnotationList)
      component = fixture.componentInstance
      fixture.detectChanges()
      expect(component).toBeTruthy()
    })

    describe("> filesExport$", () => {
      beforeEach(() => {
        const svc = TestBed.inject(ModularUserAnnotationToolService)

        const dummyGeom: Partial<IAnnotationGeometry> = {
          id: 'foo',
          toSands() {
            return {} as any
          },
          toMetadata() {
            return {} as any
          },
          toJSON() {
            return {}
          }
        }
        svc.spaceFilteredManagedAnnotations$ = of([dummyGeom] as IAnnotationGeometry[])
      })
      it("> do not emit duplicated values", () => {
        
        fixture = TestBed.createComponent(AnnotationList)
        component = fixture.componentInstance
        
        expect(component.filesExport$).toBeObservable(
          hot('(a|)', {
            a: [{
              filename: 'README.md',
              filecontent: readmeContent
            }, {
              filename: `foo.sands.json`,
              filecontent: '{}'
            }, {
              filename: `foo.desc.json`,
              filecontent: '{}'
            }],
          })
        )
      })
    })
  })
})
