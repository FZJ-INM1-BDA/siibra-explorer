import {AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, Output, ViewChild} from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {Observable, Subject, Subscription} from "rxjs";
import html2canvas from "html2canvas";
import {select, Store} from "@ngrx/store";
import {ConnectivityBrowserService} from "src/ui/connectivityBrowser/connectivityBrowser.service";
import {safeFilter} from "src/services/stateStore.service";
import {distinctUntilChanged, map} from "rxjs/operators";

@Component({
    selector: 'connectivity-browser',
    templateUrl: './connectivityBrowser.template.html',
    styleUrls: ['./connectivityBrowser.style.css']
})
export class ConnectivityBrowserComponent implements AfterViewInit {

    @Input() region: string = ''
    @Input() areaNameObservable: Observable<string> = new Subject()

    logarithmSelected = false
    math = Math

    private selectedParcellation$: Observable<any>
    private subscriptions: Subscription[] = []
    private selectedParcellation: any

    constructor(private constantService: AtlasViewerConstantsServices, private store$: Store<any>, public connectivityService: ConnectivityBrowserService ){
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
            })
        )
     }


    changeConnectivityRegion(regionName) {
        this.region = regionName
        this.connectivityService.getConnectivityByRegion(regionName)
    }


    downloadCSV() {

        const rows = [['Name', 'Number', 'Log10']]

        this.connectivityService.connectedAreas.forEach(ca => {
            rows.push(['"' + ca.name+ '"',ca.numberOfConnections,Math.log10(ca.numberOfConnections)])
        })

        let csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "my_data.csv")
        document.body.appendChild(link)

        link.click()
    }

    @ViewChild('chartContent', {read: ElementRef}) chartContent: ElementRef

    canvasForScreenshotConnectivityChart
    downloadPNG() {
        this.chartContent.nativeElement.classList.remove('overflow-auto')
        html2canvas(this.chartContent.nativeElement).then(canvas => {
           this.canvasForScreenshotConnectivityChart = canvas
           this.chartContent.nativeElement.classList.add('overflow-auto')
        }).then(() => {
            const encodedUri = encodeURI(this.canvasForScreenshotConnectivityChart.toDataURL())
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", "connectivity.png")
            document.body.appendChild(link)
            link.click()
        })
    }

    numberToForChart(number) {
        return this.logarithmSelected? Math.log10(number).toFixed(2) :  number
    }

}