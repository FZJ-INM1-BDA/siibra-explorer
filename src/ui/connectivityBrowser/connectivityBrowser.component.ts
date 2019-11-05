import {AfterViewInit, Component} from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {ChartData, ChartDataSets, ChartOptions, ChartType} from "chart.js";
import {forEach} from "@angular/router/src/utils/collection";

@Component({
    selector: 'connectivity-browser',
    templateUrl: './connectivityBrowser.template.html',
    styleUrls: ['./connectivityBrowser.style.css']
})
export class ConnectivityBrowserComponent implements AfterViewInit{


    areaName = 'Area 5M (SPL) - left hemisphere'
    connectedAreas = []
    overConnectedAreaIndex = -1
    collapseMenu = -1


    constructor(private constantService: AtlasViewerConstantsServices){}

    ngAfterViewInit(): void {
        this.getConnections(this.areaName)
    }


    getConnections(regionName) {
        this.cleanComponentState()
        this.fetchConnections(regionName)
            .then(areas => this.connectedAreas.push(...JSON.parse(JSON.stringify(areas))))
        // ToDo Can used Logarithms
        //     .then(a => {
        //         this.connectedAreas.forEach(a => {
        //             a.numberOfConnections = Math.log10(a.numberOfConnections)
        //         })
        //     })
    }


    fetchConnections(areaName) {
            const encodedRegionName = encodeURIComponent(areaName)
            return new Promise((resolve, reject) => {
                fetch(`${this.constantService.backendUrl}connectivity/connectivityMatrixData?region=${encodedRegionName}`,  )
                    .then(res => res.json())
                    .then(resolve)
                    .then(console.log)
                    .catch(reject)
            })
    }

    changeConnectivityRegion(regionName) {
        this.areaName = regionName
        this.getConnections(regionName)
    }

    cleanComponentState() {
        this.connectedAreas = []
        this.overConnectedAreaIndex = -1
        this.collapseMenu = -1
    }

    getRoundNumber(number) {
        return Math.round(number)
    }

}