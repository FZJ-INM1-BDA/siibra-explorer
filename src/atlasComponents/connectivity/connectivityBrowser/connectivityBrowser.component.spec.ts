import {ConnectivityBrowserComponent} from "./connectivityBrowser.component";
import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {Action} from "@ngrx/store";
import {HttpClientModule} from "@angular/common/http";
import {CUSTOM_ELEMENTS_SCHEMA} from "@angular/core";
import {provideMockActions} from "@ngrx/effects/testing";
import {MockStore, provideMockStore} from "@ngrx/store/testing";
import {Observable, of} from "rxjs";
import { DatabrowserModule } from "src/atlasComponents/databrowserModule";
import { viewerStateAllRegionsFlattenedRegionSelector, viewerStateOverwrittenColorMapSelector } from "src/services/state/viewerState/selectors";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState.store.helper";

describe('ConnectivityComponent', () => {

    let component: ConnectivityBrowserComponent;
    let fixture: ComponentFixture<ConnectivityBrowserComponent>;
    const actions$: Observable<Action> = of({type: 'TEST'})

    let datasetList = [
        {
            id: 'id1',
            name: 'n1',
            description: 'd1',
            kgId: 'kgId1',
            kgschema: 'kgschema1'
        }, {
            id: 'id2',
            name: 'n2',
            description: 'd2',
            kgId: 'kgId2',
            kgschema: 'kgschema2'
        }
    ]

    beforeEach(async (() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                DatabrowserModule,
            ],
            providers: [
                provideMockActions(() => actions$),
                provideMockStore()
            ],
            declarations: [ConnectivityBrowserComponent],
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

    it('> change dataset changes description, kgId and kgschema', () => {
        fixture = TestBed.createComponent(ConnectivityBrowserComponent)
        component = fixture.componentInstance

        component.datasetList = datasetList

        component.changeDataset({value: 'n1'})

        expect(component.selectedDatasetDescription).toEqual('d1')
        expect(component.selectedDatasetKgId).toEqual('kgId1')
        expect(component.selectedDatasetKgSchema).toEqual('kgschema1')

        component.changeDataset({value: 'n2'})

        expect(component.selectedDatasetDescription).toEqual('d2')
        expect(component.selectedDatasetKgId).toEqual('kgId2')
        expect(component.selectedDatasetKgSchema).toEqual('kgschema2')
    })

});