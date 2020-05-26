import { Component } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { PreviewDatasetFile, IAV_DATASET_PREVIEW_DATASET_FN, IAV_DATASET_PREVIEW_ACTIVE } from './previewDatasetFile.directive'
import { Subject } from "rxjs";

@Component({
  template: ''
})

class TestCmp{
  testmethod(arg) {}
}

const dummyMatSnackBar = {
  open: jasmine.createSpy('open')
}

const previewDatasetFnSpy = jasmine.createSpy('previewDatasetFn')
const mockDatasetActiveObs = new Subject()
const getDatasetActiveObs = jasmine.createSpy('getDatasetActive').and.returnValue(mockDatasetActiveObs)

describe('ShowDatasetDialogDirective', () => {
  let testModule
  beforeEach(async(() => {
    testModule = TestBed
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
          },
          // {
          //   provide: IAV_DATASET_PREVIEW_ACTIVE,
          //   useValue: getDatasetActiveObs
          // }
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

  describe('> DI', () => {
    describe(`> ${IAV_DATASET_PREVIEW_ACTIVE}`, () => {

      afterEach(() => {
        getDatasetActiveObs.calls.reset()
      })

      describe('> if not provided', () => {
        beforeEach(() => {
          TestBed.overrideComponent(TestCmp, {
            set: {
              template: `
              <div iav-dataset-preview-dataset-file
                (iav-dataset-preview-active-changed)="testmethod($event)"
                iav-dataset-preview-dataset-file-filename="banana">
              </div>
              `,
            }
          }).compileComponents()
        })


        it('> should init directive', () => {
          const fixture = TestBed.createComponent(TestCmp)
          fixture.detectChanges()
          const directive = fixture.debugElement.query( By.directive( PreviewDatasetFile ) )
          expect(directive).toBeTruthy()
        })

        it('> should not call getDatasetActiveObs', () => {

          const fixture = TestBed.createComponent(TestCmp)
          fixture.detectChanges()
          expect(getDatasetActiveObs).not.toHaveBeenCalled()
        })

        it('> if not provided, on subject next, should not emit active$', () => {
          
          const fixture = TestBed.createComponent(TestCmp)
          const cmp = fixture.debugElement.componentInstance

          const testmethodSpy = spyOn(cmp, 'testmethod')

          fixture.detectChanges()
          mockDatasetActiveObs.next(true)
          fixture.detectChanges()

          expect(testmethodSpy).not.toHaveBeenCalled()
        })
      })

      describe('> if provided', () => {
        beforeEach(() => {
          TestBed.overrideComponent(TestCmp, {
            set: {
              template: `
              <div iav-dataset-preview-dataset-file
                (iav-dataset-preview-active-changed)="testmethod($event)"
                iav-dataset-preview-dataset-file-filename="banana">
              </div>
              `,
              providers: [
                {
                  provide: IAV_DATASET_PREVIEW_ACTIVE,
                  useValue: getDatasetActiveObs
                }
              ]
            }
          }).compileComponents()
        })

        it('> should call getDatasetObs', () => {
          const fixture = TestBed.createComponent(TestCmp)
          fixture.detectChanges()
          expect(getDatasetActiveObs).toHaveBeenCalled()
        })

        it('> on obs.next, should emit active$,', () => {

          const fixture = TestBed.createComponent(TestCmp)
          const cmp = fixture.debugElement.componentInstance

          const testmethodSpy = spyOn(cmp, 'testmethod')

          fixture.detectChanges()
          mockDatasetActiveObs.next(true)
          fixture.detectChanges()

          expect(testmethodSpy).toHaveBeenCalledWith(true)
        })
      })
    })
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