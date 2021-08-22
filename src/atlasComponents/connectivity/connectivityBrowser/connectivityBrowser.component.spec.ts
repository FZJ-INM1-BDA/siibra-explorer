import {ConnectivityBrowserComponent} from "./connectivityBrowser.component";
import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {Action} from "@ngrx/store";
import {HttpClientModule} from "@angular/common/http";
import {CUSTOM_ELEMENTS_SCHEMA, Directive, Input} from "@angular/core";
import {provideMockActions} from "@ngrx/effects/testing";
import {MockStore, provideMockStore} from "@ngrx/store/testing";
import {Observable, of} from "rxjs";
import { viewerStateAllRegionsFlattenedRegionSelector, viewerStateOverwrittenColorMapSelector } from "src/services/state/viewerState/selectors";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState.store.helper";
import {BS_ENDPOINT} from "src/util/constants";
import {MatDialogModule} from "@angular/material/dialog";

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
            ['@id']: 'id1',
            src_name: 'id1',
            src_info: 'd1',
            kgId: 'kgId1',
            kgschema: 'kgschema1'
        }, {
            ['@id']: 'id2',
            src_name: 'id2',
            src_info: 'd2',
            kgId: 'kgId2',
            kgschema: 'kgschema2'
        }
    ]

    beforeEach(async (() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                MatDialogModule
            ],
            providers: [
                provideMockActions(() => actions$),
                provideMockStore(),
                {
                    provide: BS_ENDPOINT,
                    useValue: MOCK_BS_ENDPOINT
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
        mockStore.overrideSelector(viewerStateAllRegionsFlattenedRegionSelector, [])
        mockStore.overrideSelector(viewerStateOverwrittenColorMapSelector, null)
        mockStore.overrideSelector(ngViewerSelectorClearViewEntries, [])
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

        component.datasetList = datasetList

        component.changeDataset({value: 'id1'})

        expect(component.selectedDataset).toEqual('id1')
        expect(component.selectedDatasetDescription).toEqual('d1')

        component.changeDataset({value: 'id2'})

        expect(component.selectedDataset).toEqual('id2')
        expect(component.selectedDatasetDescription).toEqual('d2')
    })

});
