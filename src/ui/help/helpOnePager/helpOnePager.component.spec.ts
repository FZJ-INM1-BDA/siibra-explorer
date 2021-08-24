import { CommonModule } from '@angular/common'
import { TestBed } from '@angular/core/testing'
import { ComponentsModule } from 'src/components'
import { AngularMaterialModule } from 'src/sharedModules'
import { QuickTourModule } from 'src/ui/quickTour'
import { PureContantService } from 'src/util'
import { UtilModule } from 'src/util/util.module'
import { HelpOnePager } from './helpOnePager.component'

describe('> helpOnePager.component.ts', () => {
  describe('> HelpOnePager', () => {
    beforeEach(async() => {
      await TestBed.configureTestingModule({
        imports: [
          ComponentsModule,
          CommonModule,
          /**
           * for media query directive
           */
          UtilModule,
          AngularMaterialModule,
          QuickTourModule
        ],
        declarations: [
          HelpOnePager,
        ],
        providers: [
          {
            provide: PureContantService,
            useValue: {}
          }
        ]
      }).compileComponents()
    })
    it('> should render a table', () => {
      const fixture = TestBed.createComponent(HelpOnePager)
      fixture.detectChanges()
      const table = fixture.debugElement.nativeElement.querySelector('table')
      expect(table).toBeTruthy()
    })

    it('> should not render image', () => {
      const fixture = TestBed.createComponent(HelpOnePager)
      fixture.detectChanges()
      const img = fixture.debugElement.nativeElement.querySelector('img')
      expect(img).toBeFalsy()
    })
  })
})
