import {ComponentFactory, ComponentFactoryResolver, ComponentRef, Injectable, Injector} from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {ConnectivityMatrixBrowserComponent} from "src/ui/connectivityMatrixBrowser/connectivityMatrixBrowser.component";
import {WidgetUnit} from "src/atlasViewer/widgetUnit/widgetUnit.component";
import {OPEN_SIDE_PANEL} from "src/services/state/uiState.store";
import {WidgetServices} from "src/atlasViewer/widgetUnit/widgetService.service";

@Injectable()
export class ConnectivityMatrixBrowserService {
    cmbcf: ComponentFactory<ConnectivityMatrixBrowserComponent>
    connectivityMatrixBrowser: ComponentRef<ConnectivityMatrixBrowserComponent> = null
    cmbWidget: ComponentRef<WidgetUnit> = null

    constructor(private constantService: AtlasViewerConstantsServices,
                private widgetServices: WidgetServices,
                cfr: ComponentFactoryResolver,
                private injector: Injector,) {
        this.cmbcf = cfr.resolveComponentFactory(ConnectivityMatrixBrowserComponent)
    }

    get isMobile(){
        return this.constantService.mobile
    }

    getConnectedAreas(regionName) {
        const _url = new URL(`${this.constantService.backendUrl}datasets/getConnectedAreas`)
        const data = {
            regionName: regionName
        }
        return fetch(_url.toString(), {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)})
            .then(res => {
                if (res.status >= 400) throw new Error(res.status.toString())
                return res.clone().json()
            })
    }

    searchConnectedAreas(regionName, position) {
        this.connectivityMatrixBrowser = this.cmbcf.create(this.injector)
        this.connectivityMatrixBrowser.instance.connectedAreas = this.getConnectedAreas(regionName)

        this.cmbWidget = this.widgetServices.addNewWidget(this.connectivityMatrixBrowser, {
            exitable: true,
            minimizable: false,
            persistency: true,
            state: 'floating',
            title: 'Connectivity Matrix Browser',
            titleHTML: '<i class="fab fa-connectdevelop"></i> Connectivity Matrix Browser'
        })

        this.cmbWidget.onDestroy(() => {
            this.connectivityMatrixBrowser = null
            this.cmbWidget = null
        })

        this.cmbWidget.instance.position = [position.left, position.top]
    }
}