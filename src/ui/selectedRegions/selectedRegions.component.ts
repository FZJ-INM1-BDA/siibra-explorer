import {Component, Input} from "@angular/core";
import {Observable} from "rxjs";
import {CHANGE_NAVIGATION, SELECT_REGIONS} from "src/services/state/viewerState.store";
import {Store} from "@ngrx/store";
import {ToastService} from "src/services/toastService.service";

@Component({
    selector: 'selected-regions',
    templateUrl: './selectedRegions.template.html',
    styleUrls: ['./selectedRegions.style.css']
})

export class SelectedRegionsComponent {
    @Input() selectedRegions$: Observable<any>

    constructor(private store: Store<any>,
                private toastService: ToastService) {}

    removeRegionFromSelectedList(region, selectedRegions) {
        this.store.dispatch({
            type: SELECT_REGIONS,
            selectRegions: selectedRegions.filter(r => r.name !== region.name)
        })
    }

    navigateToRegion(region) {
        if (region.position) {
            this.store.dispatch({
                type: CHANGE_NAVIGATION,
                navigation: {
                    position: region.position
                },
                animation: {}
            })
        } else {
            this.toastService.showToast(`${region.name} does not have a position defined`, {
                timeout: 5000,
                dismissable: true
            })
        }
    }
}
