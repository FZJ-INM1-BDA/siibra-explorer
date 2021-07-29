import { CommonModule } from "@angular/common"
import { TestBed, async } from "@angular/core/testing"
import { MAT_DIALOG_DATA } from "@angular/material/dialog"
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module"
import { ComponentsModule } from "../components.module"
import { ConfirmDialogComponent } from "./confirmDialog.component"

describe('> confirmDialog.component.spec.ts', () => {

  describe('> ConfirmDialogComponent', () => {
    let matDialogData = {}
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          CommonModule,
          ComponentsModule,
        ],
        providers: [{
          provide: MAT_DIALOG_DATA,
          useFactory: () => {
            return matDialogData as any
          }
        }]
      }).compileComponents()
    }))

    it('> can be created', () => {
      const fixutre = TestBed.createComponent(ConfirmDialogComponent)
      expect(fixutre).toBeTruthy()
    })

    describe('> if both markdown and message are truthy', () => {
      beforeEach(() => {
        matDialogData = {
          markdown: `hello world`,
          message: `foo bar`,
        }
      })
      it('> should show markdown in preference', () => {
        const fixture = TestBed.createComponent(ConfirmDialogComponent)
        fixture.detectChanges()
        const text = fixture.debugElement.nativeElement.textContent
        expect(
          /hello\sworld/.test(text)
        ).toBeTruthy()
        expect(
          /foo\sbar/.test(text)
        ).toBeFalsy()
      })
    })
  })

})