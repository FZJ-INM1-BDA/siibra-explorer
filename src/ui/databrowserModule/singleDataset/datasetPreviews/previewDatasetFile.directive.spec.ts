import { Component } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { PreviewDatasetFile, IAV_DATASET_PREVIEW_DATASET_FN } from './previewDatasetFile.directive'

@Component({
  template: ''
})

class TestCmp{}

const dummyMatSnackBar = {
  open: jasmine.createSpy('open')
}

const previewDatasetFnSpy = jasmine.createSpy('previewDatasetFn')

describe('ShowDatasetDialogDirective', () => {
  beforeEach(async(() => {
    TestBed
      .configureTestingModule({
        imports: [
          AngularMaterialModule
        ],
        declarations: [
          TestCmp,
          PreviewDatasetFile,
        ],
        providers: [
          {
            provide: MatSnackBar,
            useValue: dummyMatSnackBar
          },
          {
            provide: IAV_DATASET_PREVIEW_DATASET_FN,
            useValue: previewDatasetFnSpy
          }
        ]
      })
      
  }))

  afterEach(() => {
    dummyMatSnackBar.open.calls.reset()
    previewDatasetFnSpy.calls.reset()
  })

  it('should be able to test directive', () => {

    TestBed.overrideComponent(TestCmp, {
      set: {
        template: '<div iav-dataset-preview-dataset-file></div>',
      }
    }).compileComponents()

    const fixutre = TestBed.createComponent(TestCmp)
    const directive = fixutre.debugElement.query( By.directive( PreviewDatasetFile ) )

    expect(directive).not.toBeNull()
  })

  it('without providing file or filename, should not call emitFn', () => {

    TestBed.overrideComponent(TestCmp, {
      set: {
        template: '<div iav-dataset-preview-dataset-file></div>',
      }
    }).compileComponents()
    
    const fixutre = TestBed.createComponent(TestCmp)
    fixutre.detectChanges()
    const directive = fixutre.debugElement.query( By.directive( PreviewDatasetFile ) )
    directive.nativeElement.click()

    expect(dummyMatSnackBar.open).toHaveBeenCalled()
    expect(previewDatasetFnSpy).not.toHaveBeenCalled()

  })

  it('only providing filename, should call emitFn', () => {

    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
        <div iav-dataset-preview-dataset-file
          iav-dataset-preview-dataset-file-filename="banana">
        </div>
        `,
      }
    }).compileComponents()
    
    const fixutre = TestBed.createComponent(TestCmp)
    fixutre.detectChanges()
    const directive = fixutre.debugElement.query( By.directive( PreviewDatasetFile ) )
    directive.nativeElement.click()

    expect(dummyMatSnackBar.open).not.toHaveBeenCalled()
    expect(previewDatasetFnSpy).toHaveBeenCalledWith({ filename: 'banana' }, { fullId: null })

  })
})