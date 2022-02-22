import {ConfigComponent} from "src/ui/config/configCmp/config.component";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {Observable, of} from "rxjs";
import {AngularMaterialModule} from "src/sharedModules";
import {PluginModule} from "src/plugin";
import {LayoutModule} from "src/layouts/layout.module";
import {ConfigStore} from "src/ui/config/configCmp/config.store";
import {Action, StoreModule} from "@ngrx/store";
import {HttpClientModule} from "@angular/common/http";
import {provideMockActions} from "@ngrx/effects/testing";
import {MockStore, provideMockStore} from "@ngrx/store/testing";
import {BS_ENDPOINT} from "src/util/constants";
import {HarnessLoader} from "@angular/cdk/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {MatSlideToggleHarness} from "@angular/material/slide-toggle/testing";
import {
    ngViewerSelectorPanelMode,
    ngViewerSelectorPanelOrder
} from "src/services/state/ngViewerState/selectors";
import {PANELS} from "src/services/state/ngViewerState/constants";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {PureContantService} from "src/util";


fdescribe('config.component.ts', () => {
    let component: ConfigComponent
    let fixture: ComponentFixture<ConfigComponent>

    const mockConfigStore = jasmine.createSpyObj(
        'ConfigStore',
        ['setState',
            'setAxisLineVisible',
            'setSliceBackground',
            'setBackgroundVisibility'],
        { sliceBackgroundRgb$: of('#CCCCCC'),
            axisLineVisible$: of(false),
            togglePerspectiveViewSubstrate$: of(true)})

    const MOCK_BS_ENDPOINT = `http://localhost:1234`
    const actions$: Observable<Action> = of({type: 'TEST'})
    let mockStore: MockStore
    let loader: HarnessLoader;



    beforeEach((async () => {
        await TestBed.configureTestingModule({
            declarations: [ ConfigComponent, ],
            imports: [
                StoreModule.forRoot({}),
                AngularMaterialModule,
                BrowserAnimationsModule,
                HttpClientModule,
                PluginModule,
                LayoutModule
            ],
            providers: [
                provideMockActions(() => actions$),
                provideMockStore({
                    initialState: {
                        viewerConfigState: {
                            gpuLimit: 1e9,
                            animation: true
                        }
                    }
                }),
                {
                    provide: BS_ENDPOINT,
                    useValue: MOCK_BS_ENDPOINT
                },
                {
                    provide: PureContantService,
                    useFactory: () => {
                        return {
                            getViewerConfig: jasmine.createSpy('getViewerConfig')
                        }
                    }
                }
            ],
        }).compileComponents()

        await TestBed.overrideProvider(ConfigStore, { useValue: mockConfigStore })

        mockStore = await TestBed.inject(MockStore)
        await mockStore.overrideSelector(ngViewerSelectorPanelMode, PANELS.FOUR_PANEL)
        await mockStore.overrideSelector(ngViewerSelectorPanelOrder, '0123')

        fixture = await TestBed.createComponent(ConfigComponent)
        await fixture.detectChanges()
        loader = await TestbedHarnessEnvironment.loader(fixture);
        component = await fixture.componentInstance


    }))

    describe('Viewer config', () => {

        beforeEach(async () => {
            const configEl: HTMLElement = fixture.nativeElement;
            const tabGroup = configEl.querySelector('mat-tab-group')!
            const tabEl = tabGroup.querySelector('[aria-label="viewer-tab"]')!

            const event = await new MouseEvent('click', {bubbles: true})
            tabEl.dispatchEvent(event);
        })

        describe('set axlisLineVisible visibility', () => {

            it('axisLine toggle should false by default', async () => {
                const axisLineEl = await loader.getAllHarnesses(
                    MatSlideToggleHarness.with({
                        name: 'axis-line-toggle',
                    })
                )
                const isChecked = await axisLineEl[0].isChecked()
                expect(isChecked).toBeFalse()
            })

            it('toggle axis line element should call mockConfigStore -> setAxisLineVisible', async () => {
                const axisLineEl = await loader.getAllHarnesses(
                    MatSlideToggleHarness.with({
                        name: 'axis-line-toggle',
                    })
                )
                await axisLineEl[0].toggle()
                expect(mockConfigStore.setAxisLineVisible).toHaveBeenCalledWith(true);
            })

        });

        describe('set background visibility', () => {

            it('togglePerspectiveViewSubstrate toggle should false by default', async () => {
                const persBgEl = await loader.getAllHarnesses(
                    MatSlideToggleHarness.with({
                        name: 'perspective-background-toggle',
                    })
                )
                const isChecked = await persBgEl[0].isChecked()
                expect(isChecked).toBeTrue()
            })

            it('Bg color toggle should call mockConfigStore -> setBackgroundVisibility', async () => {
                const persBgEl = await loader.getAllHarnesses(
                    MatSlideToggleHarness.with({
                        name: 'perspective-background-toggle',
                    })
                )
                await persBgEl[0].toggle()
                expect(mockConfigStore.setBackgroundVisibility).toHaveBeenCalledWith(false);
            })

            it('backgroundColorPicker default value should be correct', async () => {
                const persBgEl = await loader.getAllHarnesses(
                    MatSlideToggleHarness.with({
                        name: 'perspective-background-toggle',
                    })
                )
                await persBgEl[0].toggle()
                const colorPicker = await fixture.nativeElement.querySelector('[name="backgroundColorPicker"]')!
                expect(colorPicker.value).toEqual('#cccccc')
            })

        });

    })

});
