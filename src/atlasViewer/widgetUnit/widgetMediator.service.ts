import {Injectable} from "@angular/core";
import {DatabrowserService} from "src/ui/databrowserModule/databrowser.service";

@Injectable()
export class WidgetMediatorService {
    constructor(private dataBrowserService: DatabrowserService) {}

    isDataBrowserWidget(widgetUnit) {
        return this.dataBrowserService.instantiatedWidgetUnits.includes(widgetUnit)
    }
    pinWidget(widgetUnit) {
        this.dataBrowserService.pushWidgetUnitInstance(widgetUnit)
    }
    removeWidgetUnitInstance(widgetUnit) {
        this.dataBrowserService.removeWidgetUnitInstance(widgetUnit)
    }
}