import {Injectable} from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {Observable, Subscription} from "rxjs";
import {select, Store} from "@ngrx/store";
import {HIDE_SIDE_PANEL_CONNECTIVITY, safeFilter} from "src/services/stateStore.service";
import {distinctUntilChanged, map, take} from "rxjs/operators";

@Injectable({
    providedIn: 'root',
})
export class ConnectivityBrowserService {

    connectedAreas = []
    overConnectedAreaIndex = -1
    collapseMenu = -1
    allRegions = []
    hemisphere = ''

    defaultColorMap

    private selectedParcellation$: Promise<unknown>


    constructor(private constantService: AtlasViewerConstantsServices, private store$: Store<any>) {}

    getConnectivityByRegion(regionName) {
        if (regionName.includes('left hemisphere'))
            this.hemisphere = ' - left hemisphere'
        else
            this.hemisphere = ' - right hemisphere'

        const parcellation = this.selectedParcellation$ = this.store$.pipe(
            select('viewerState'),
            safeFilter('parcellationSelected'),
            map(state=>state.parcellationSelected),
            distinctUntilChanged(),
            take(1)
        ).toPromise()

        parcellation.then(p => {
            this.cleanComponentState()
            this.fetchConnectivityByRegion(regionName)
                .then(areas => this.connectedAreas.push(...JSON.parse(JSON.stringify(areas))))
                .then(() => {
                    this.getAllRegionsFromParcellation(p.regions)
                    this.saveAndDisableExistingColorTemplate()
                })
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

    saveAndDisableExistingColorTemplate() {

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
                .filter(r => r.name === area.name + this.hemisphere)
                .map(r => r)

            if (areaAsRegion && areaAsRegion.length && areaAsRegion[0].ngId)
                // @ts-ignore
                map.get(areaAsRegion[0].ngId).set(areaAsRegion[0].labelIndex, {red: area.color.r, green: area.color.g, blue: area.color.b})

            getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(map)
        })
    }

    fetchConnectivityByRegion(regionName) {
        const encodedRegionName = encodeURIComponent(regionName)
        return new Promise((resolve, reject) => {
            fetch(`${this.constantService.backendUrl}connectivity/connectivityMatrixData?region=${encodedRegionName}`,  )
                .then(res => res.json())
                .then(resolve)
                .catch(reject)
        })
    }

    cleanComponentState() {
        this.connectedAreas = []
        this.overConnectedAreaIndex = -1
        this.collapseMenu = -1
    }

    closeConnectivityView() {

        this.allRegions.forEach(r => {
            if (r && r.ngId && r.rgb) {
                // @ts-ignore
                this.defaultColorMap.get(r.ngId).set(r.labelIndex, {red: r.rgb[0], green: r.rgb[1], blue: r.rgb[2]})
            }
            getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(this.defaultColorMap)
        })

        this.cleanComponentState()

        this.store$.dispatch({
            type: HIDE_SIDE_PANEL_CONNECTIVITY,
        })
    }

}

function getWindow (): any {
    return window;
}