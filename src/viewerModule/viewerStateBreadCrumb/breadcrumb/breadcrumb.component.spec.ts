import {OriginalDatainfoPipe, ViewerStateBreadCrumb} from "src/viewerModule/viewerStateBreadCrumb/breadcrumb/breadcrumb.component";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ToggleParcellationDirective} from "src/viewerModule/viewerStateBreadCrumb/toggle-parcellation.directive";
import {CommonModule} from "@angular/common";
import {AngularMaterialModule} from "src/sharedModules";
import {MockStore, provideMockStore} from "@ngrx/store/testing";
import {PureContantService, UtilModule} from "src/util";
import {viewerStateGetOverlayingAdditionalParcellations, viewerStateSelectedParcellationSelector} from "src/services/state/viewerState/selectors";
import {HttpClientModule} from "@angular/common/http";
import {By} from "@angular/platform-browser";


class MockPureConstantService{
    async getViewerConfig() {
        return {}
    }
}
const mockPureConstantService = new MockPureConstantService()

let component: ViewerStateBreadCrumb
let fixture: ComponentFixture<ViewerStateBreadCrumb>
let mockStore: MockStore

const defaultParc = {
    name: 'defParc',
    originDatainfos: []
}
const addParc = [{
    name: 'addParc',
    originDatainfos: []
}]

describe('> viewerCtrlCmp.component.ts', () => {
    describe('> ViewerCtrlCmp', () => {

        beforeEach( async () => {
            await TestBed.configureTestingModule({
                imports: [
                    CommonModule,
                    AngularMaterialModule,
                    UtilModule,
                    HttpClientModule
                ],
                declarations: [
                    ViewerStateBreadCrumb,
                    ToggleParcellationDirective,
                    OriginalDatainfoPipe
                ],
                providers: [
                    provideMockStore(),
                    {
                        provide: PureContantService,
                        useValue: mockPureConstantService
                    }
                ]
            })
            mockStore = await TestBed.inject(MockStore)
            await mockStore.overrideSelector(viewerStateSelectedParcellationSelector, defaultParc)
            await mockStore.overrideSelector(viewerStateGetOverlayingAdditionalParcellations, addParc)

            fixture = await TestBed.createComponent(ViewerStateBreadCrumb)
            component = fixture.componentInstance
            fixture.detectChanges()
        })

        it('> hide delineation icon should exist', async () => {
            const toggleIcon = await fixture.debugElement.query(By.directive(ToggleParcellationDirective))
            expect(toggleIcon).toBeTruthy()
        })

        it('> hide delineation eye should be open by default', async () => {
            const toggleIcon = await fixture.debugElement.query(By.directive(ToggleParcellationDirective))
            expect(toggleIcon.nativeElement.getAttribute('class')).toContain('fa-eye')
        })

        it('> hide delineation eye should slashed if parcellation not visible', async () => {
            const toggleIcon = fixture.debugElement.query(By.directive(ToggleParcellationDirective))
            const dir = toggleIcon.injector.get(ToggleParcellationDirective) as ToggleParcellationDirective
            dir.visible = false
            fixture.detectChanges()
            expect(toggleIcon.nativeElement.getAttribute('class')).toContain('fa-eye-slash')
        })
    })
})
