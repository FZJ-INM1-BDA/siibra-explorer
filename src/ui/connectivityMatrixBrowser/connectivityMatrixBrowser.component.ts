import {Component} from "@angular/core";

@Component({
    selector: 'connectivity-matrix-browser',
    templateUrl: './connectivityMatrixBrowser.template.html',
})
export class ConnectivityMatrixBrowserComponent {

    connectedAreas: Promise<any>
}