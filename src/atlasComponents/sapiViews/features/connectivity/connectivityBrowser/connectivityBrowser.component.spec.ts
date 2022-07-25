import {ConnectivityBrowserComponent} from "./connectivityBrowser.component";
import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {Action} from "@ngrx/store";
import {HttpClientModule} from "@angular/common/http";
import {CUSTOM_ELEMENTS_SCHEMA, Directive, Input} from "@angular/core";
import {provideMockActions} from "@ngrx/effects/testing";
import {MockStore, provideMockStore} from "@ngrx/store/testing";
import {Observable, of} from "rxjs";
import {SAPI} from "src/atlasComponents/sapi";
import {AngularMaterialModule} from "src/sharedModules";

/**
 * injecting databrowser module is bad idea
 * since it relies on its own selectors
 * since the only reason why data browser is imported is to use show dataset dialogue
 * just use a dummy directive
 */
const MOCK_BS_ENDPOINT = `http://localhost:1234`

@Directive({
    selector: '[iav-dataset-show-dataset-dialog]'
})

class DummyDirective{
    @Input('iav-dataset-show-dataset-dialog-name')
    name: string
    @Input('iav-dataset-show-dataset-dialog-description')
    description: string
    @Input('iav-dataset-show-dataset-dialog-kgid')
    kgId: string
    @Input('iav-dataset-show-dataset-dialog-kgschema')
    kgSchema: string
}

describe('ConnectivityComponent', () => {

    let component: ConnectivityBrowserComponent;
    let fixture: ComponentFixture<ConnectivityBrowserComponent>;
    const actions$: Observable<Action> = of({type: 'TEST'})

    let datasetList = [
        {
            '@id': 'id1',
            name: 'id1',
            description: 'd1',
            kgId: 'kgId1',
            kgschema: 'kgschema1',
            items: []
        }, {
            '@id': 'id2',
            name: 'id2',
            description: 'd2',
            kgId: 'kgId2',
            kgschema: 'kgschema2',
            items: []
        }
    ]

    beforeEach(async (() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                AngularMaterialModule
            ],
            providers: [
                provideMockActions(() => actions$),
                provideMockStore(),
                {
                    provide: SAPI,
                    useValue: {
                        atlases$: of([]),
                        getSpaceDetail: jasmine.createSpy('getSpaceDetail'),
                        getParcDetail: jasmine.createSpy('getParcDetail'),
                        getParcRegions: jasmine.createSpy('getParcRegions'),
                    }
                }
            ],
            declarations: [
                ConnectivityBrowserComponent,
                DummyDirective,
            ],
            schemas: [
                CUSTOM_ELEMENTS_SCHEMA,
            ],
        }).compileComponents()

    }));

    beforeEach(() => {
        const mockStore = TestBed.inject(MockStore)
        // mockStore.overrideSelector(viewerStateOverwrittenColorMapSelector, null)
        // mockStore.overrideSelector(ngViewerSelectorClearViewEntries, [])
    })

    it('> component can be created', async () => {
        fixture = TestBed.createComponent(ConnectivityBrowserComponent)
        component = fixture.componentInstance
        expect(component).toBeTruthy()
    })

    // ToDo create test for kgId and kgSchema after it will work while viewing dataset
    it('> change dataset changes name and description', () => {
        fixture = TestBed.createComponent(ConnectivityBrowserComponent)
        component = fixture.componentInstance

        component.defaultProfile = {selectedDataset: datasetList[0]}

        expect(component.selectedDataset['@id']).toEqual('id1')
        expect(component.selectedDataset.description).toEqual('d1')

        component.defaultProfile = {selectedDataset: datasetList[1]}

        expect(component.selectedDataset['@id']).toEqual('id2')
        expect(component.selectedDataset.description).toEqual('d2')
    })

});
