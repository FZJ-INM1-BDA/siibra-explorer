import { Component } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { ShowDatasetDialogDirective, IAV_DATASET_SHOW_DATASET_DIALOG_CMP } from "./showDataset.directive";
import { By } from "@angular/platform-browser";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  template: ''
})

class TestCmp{}

const dummyMatDialog = {
  open: val => {}
}

const dummyMatSnackBar = {
  open: val => {}
}

class DummyDialogCmp{}

describe('ShowDatasetDialogDirective', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule
      ],
      declarations: [
        TestCmp,
        ShowDatasetDialogDirective,
      ],
      providers: [
        {
          provide: MatDialog,
          useValue: dummyMatDialog
        },
        {
          provide: MatSnackBar,
          useValue: dummyMatSnackBar
        },
        {
          provide: IAV_DATASET_SHOW_DATASET_DIALOG_CMP,
          useValue: DummyDialogCmp
        }
      ]
    })
  }))

  it('should be able to test directiv,', () => {

    TestBed.overrideComponent(TestCmp, {
      set: {
        template: '<div iav-dataset-show-dataset-dialog></div>'
      }
    }).compileComponents()

    const fixutre = TestBed.createComponent(TestCmp)
    const directive = fixutre.debugElement.query( By.directive( ShowDatasetDialogDirective ) )

    expect(directive).not.toBeNull()
  })

  it('if neither kgId nor fullId is defined, should not call dialog', () => {

    TestBed.overrideComponent(TestCmp, {
      set: {
        template: '<div iav-dataset-show-dataset-dialog></div>'
      }
    }).compileComponents()

    const snackbarOpenSpy = spyOn(dummyMatSnackBar, 'open').and.callThrough()
    const dialogOpenSpy = spyOn(dummyMatDialog, 'open').and.callThrough()

    const fixutre = TestBed.createComponent(TestCmp)
    fixutre.detectChanges()

    const directive = fixutre.debugElement.query( By.directive( ShowDatasetDialogDirective ) )
    directive.nativeElement.click()

    expect(snackbarOpenSpy).toHaveBeenCalled()
    expect(dialogOpenSpy).not.toHaveBeenCalled()

    snackbarOpenSpy.calls.reset()
    dialogOpenSpy.calls.reset()
  })

  it('if kgId is defined, should call dialogOpen', () => {
    
    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
        <div iav-dataset-show-dataset-dialog
          iav-dataset-show-dataset-dialog-kgid="aaa-bbb">
        </div>
        `
      }
    }).compileComponents()

    const snackbarOpenSpy = spyOn(dummyMatSnackBar, 'open').and.callThrough()
    const dialogOpenSpy = spyOn(dummyMatDialog, 'open').and.callThrough()

    const fixutre = TestBed.createComponent(TestCmp)
    fixutre.detectChanges()

    const directive = fixutre.debugElement.query( By.directive( ShowDatasetDialogDirective ) )
    directive.nativeElement.click()

    expect(snackbarOpenSpy).not.toHaveBeenCalled()
    const mostRecentCall = dialogOpenSpy.calls.mostRecent()
    const args = mostRecentCall.args as any[]

    expect(args[0]).toEqual(DummyDialogCmp)
    expect(args[1]).toEqual({
      ...ShowDatasetDialogDirective.defaultDialogConfig,
      panelClass: ['no-padding-dialog'],
      data: {
        fullId: `minds/core/dataset/v1.0.0/aaa-bbb`
      }
    })

    snackbarOpenSpy.calls.reset()
    dialogOpenSpy.calls.reset()
  })

  it('if fullId is defined, should call dialogOpen', () => {

    TestBed.overrideComponent(TestCmp, {
      set: {
        template: `
        <div iav-dataset-show-dataset-dialog
          iav-dataset-show-dataset-dialog-fullid="abc/ccc-ddd">
        </div>
        `
      }
    }).compileComponents()

    const snackbarOpenSpy = spyOn(dummyMatSnackBar, 'open').and.callThrough()
    const dialogOpenSpy = spyOn(dummyMatDialog, 'open').and.callThrough()

    const fixutre = TestBed.createComponent(TestCmp)
    fixutre.detectChanges()

    const directive = fixutre.debugElement.query( By.directive( ShowDatasetDialogDirective ) )
    directive.nativeElement.click()

    expect(snackbarOpenSpy).not.toHaveBeenCalled()
    const mostRecentCall = dialogOpenSpy.calls.mostRecent()
    const args = mostRecentCall.args as any[]
    expect(args[0]).toEqual(DummyDialogCmp)
    expect(args[1]).toEqual({
      ...ShowDatasetDialogDirective.defaultDialogConfig,
      panelClass: ['no-padding-dialog'],
      data: {
        fullId: `abc/ccc-ddd`
      }
    })

    snackbarOpenSpy.calls.reset()
    dialogOpenSpy.calls.reset()
  })
})