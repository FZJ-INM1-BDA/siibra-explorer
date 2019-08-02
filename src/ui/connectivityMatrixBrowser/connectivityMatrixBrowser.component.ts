import {Component, OnInit} from "@angular/core";
import {Observable} from "rxjs";

@Component({
    selector: 'connectivity-matrix-browser',
    templateUrl: './connectivityMatrixBrowser.template.html',
})
export class ConnectivityMatrixBrowserComponent {

    connectedAreas: Promise<any>
}