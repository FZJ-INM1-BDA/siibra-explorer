import { Component, ViewChild } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { UserLayerDragDropDirective } from "./userlayerDragdrop.directive"
import { UserLayerService } from "./service"
import { NehubaUserLayerModule } from "./module"
import { CommonModule } from "@angular/common"
import { provideMockStore } from "@ngrx/store/testing"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"

@Component({
  template: `<div sxplr-nehuba-drag-drop></div>`,
})
class TestCmp {
  @ViewChild(UserLayerDragDropDirective)
  directive: UserLayerDragDropDirective
}

describe("dragdrop.directive.spec.ts", () => {
  let fixture: ComponentFixture<TestCmp>

  let addUserLayerSpy: jasmine.Spy
  let removeUserLayerSpy: jasmine.Spy
  let getCvtFileToUrlSpy: jasmine.Spy

  let dummyFile1: File
  let dummyFile2: File
  let input: File[]

  const meta = {}
  const url = ""
  const options = {}

  describe("UserLayerDragDropDirective", () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, NehubaUserLayerModule, NoopAnimationsModule],
        declarations: [TestCmp],
        providers: [
          provideMockStore(),
          {
            provide: UserLayerService,
            useValue: {
              addUserLayer: () => {},
              removeUserLayer: () => {},
              getCvtFileToUrl: () => Promise.resolve(),
            },
          },
        ],
      })
      const svc = TestBed.inject(UserLayerService)

      addUserLayerSpy = spyOn(svc, "addUserLayer")
      removeUserLayerSpy = spyOn(svc, "removeUserLayer")
      getCvtFileToUrlSpy = spyOn(svc, "getCvtFileToUrl")

      getCvtFileToUrlSpy.and.resolveTo({ meta, url, options })

      fixture = TestBed.createComponent(TestCmp)
      fixture.detectChanges()

      dummyFile1 = (() => {
        const bl: any = new Blob([], { type: "text" })
        bl.name = "filename1.txt"
        bl.lastModifiedDate = new Date()
        return bl as File
      })()

      dummyFile2 = (() => {
        const bl: any = new Blob([], { type: "text" })
        bl.name = "filename2.txt"
        bl.lastModifiedDate = new Date()
        return bl as File
      })()
    })
    afterEach(() => {
      addUserLayerSpy.calls.reset()
      removeUserLayerSpy.calls.reset()
      getCvtFileToUrlSpy.calls.reset()
    })

    describe("> malformed input", () => {
      const scenarios = [
        {
          desc: "too few files",
          inp: [],
        },
        {
          desc: "too many files",
          inp: [dummyFile1, dummyFile2],
        },
      ]

      for (const { desc, inp } of scenarios) {
        describe(`> ${desc}`, () => {
          beforeEach(async () => {
            input = inp
            const cmp = fixture.componentInstance
            await cmp.directive.handleFileDrop(input)
          })

          it("> should not call addnglayer", () => {
            expect(getCvtFileToUrlSpy).not.toHaveBeenCalled()
          })

          // TODO having a difficult time getting snackbar harness
          // it('> snackbar should show error message', async () => {
          //   console.log('get harness')

          //   rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture)
          //   const loader = TestbedHarnessEnvironment.loader(fixture)
          //   fixture.detectChanges()
          //   const snackbarHarness = await rootLoader.getHarness(MatSnackBarHarness)
          //   console.log('got harness', snackbarHarness)
          //   // const message = await snackbarHarness.getMessage()
          //   // console.log('got message')
          //   // expect(message).toEqual(INVALID_FILE_INPUT)
          // })
        })
      }
    })

    describe("> correct input", () => {
      beforeEach(async () => {
        input = [dummyFile1]

        const cmp = fixture.componentInstance
        await cmp.directive.handleFileDrop(input)
      })

      it("> should call addNgLayer", () => {
        expect(getCvtFileToUrlSpy).toHaveBeenCalledTimes(1)
        const arg = getCvtFileToUrlSpy.calls.argsFor(0)
        expect(arg.length).toEqual(1)
        expect(arg[0]).toEqual(dummyFile1)

        expect(addUserLayerSpy).toHaveBeenCalledTimes(1)
        const args1 = addUserLayerSpy.calls.argsFor(0)

        expect(args1[0]).toBe(url)
        expect(args1[1]).toBe(meta)
        expect(args1[2]).toBe(options)
      })
    })
  })
})
