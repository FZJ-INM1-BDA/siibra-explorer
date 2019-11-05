import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    Output,
    ViewChild
} from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {Observable, Subject, Subscription} from "rxjs";
import {select, Store} from "@ngrx/store";
import {HIDE_SIDE_PANEL_CONNECTIVITY, safeFilter} from "src/services/stateStore.service";
import {distinctUntilChanged, map} from "rxjs/operators";

@Component({
    selector: 'connectivity-browser',
    templateUrl: './connectivityBrowser.template.html',
})
export class ConnectivityBrowserComponent implements AfterViewInit, OnDestroy {

    @Input() region: string = ''
    private connectedAreas = []


    private selectedParcellation$: Observable<any>
    private subscriptions: Subscription[] = []
    private selectedParcellation: any
    public collapseMenu = -1
    public allRegions = []
    public defaultColorMap

    math = Math

    @ViewChild('connectivityComponent', {read: ElementRef}) connectivityComponentElement: ElementRef

    constructor(private constantService: AtlasViewerConstantsServices, private store$: Store<any> ){
        this.selectedParcellation$ = this.store$.pipe(
            select('viewerState'),
            safeFilter('parcellationSelected'),
            map(state=>state.parcellationSelected),
            distinctUntilChanged(),
        )
    }

    ngAfterViewInit(): void {
        this.subscriptions.push(
            this.selectedParcellation$.subscribe(parcellation => {
                this.selectedParcellation = parcellation
                this.getAllRegionsFromParcellation(parcellation.regions)
            })
        )

        this.connectivityComponentElement.nativeElement.addEventListener('connectivityDataReceived', e => {
            this.connectedAreas = e.detail
            if (this.connectedAreas.length > 0) this.saveAndDisableExistingColorTemplate()
        })

        this.connectivityComponentElement.nativeElement.addEventListener('collapsedMenuChanged', e => {
            this.collapseMenu = e.detail
        })
     }

     ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe())
     }

    public closeConnectivityView() {

        this.allRegions.forEach(r => {
            if (r && r.ngId && r.rgb) {
                // @ts-ignore
                this.defaultColorMap.get(r.ngId).set(r.labelIndex, {red: r.rgb[0], green: r.rgb[1], blue: r.rgb[2]})
            }
            getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(this.defaultColorMap)
        })

        this.store$.dispatch({
            type: HIDE_SIDE_PANEL_CONNECTIVITY,
        })
    }

    saveAndDisableExistingColorTemplate() {

        const hemisphere = this.region.includes('left hemisphere')? ' - left hemisphere' : ' - right hemisphere'

        this.defaultColorMap = new Map(getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())

        const existingMap = (getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())

        const map = new Map(existingMap)

        this.allRegions.forEach(r => {

            if (r.ngId) {
                // @ts-ignore
                map.get(r.ngId).set(r.labelIndex, {red: 255, green: 255, blue: 255})
            }
        })

        this.connectedAreas.forEach(area => {
            const areaAsRegion = this.allRegions
                .filter(r => r.name === area.name + hemisphere)
                .map(r => r)

            if (areaAsRegion && areaAsRegion.length && areaAsRegion[0].ngId)
                // @ts-ignore
                map.get(areaAsRegion[0].ngId).set(areaAsRegion[0].labelIndex, {red: area.color.r, green: area.color.g, blue: area.color.b})

            getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(map)
        })
    }

    getAllRegionsFromParcellation = (regions) => {
        for (let i = 0; i<regions.length; i ++) {
            if (regions[i].children && regions[i].children.length) {
                this.getAllRegionsFromParcellation(regions[i].children)
            } else {
                this.allRegions.push(regions[i])
            }
        }
    }


}

function getWindow (): any {
    return window;
}