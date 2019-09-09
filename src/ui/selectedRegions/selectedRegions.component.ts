import {Component, Input} from "@angular/core";
import {Observable} from "rxjs";
import {CHANGE_NAVIGATION, SELECT_REGIONS} from "src/services/state/viewerState.store";
import {Store} from "@ngrx/store";
import {ToastService} from "src/services/toastService.service";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
    selector: 'selected-regions',
    templateUrl: './selectedRegions.template.html',
    styleUrls: ['./selectedRegions.style.css']
})

export class SelectedRegionsComponent {
    @Input() selectedRegions$: Observable<any>

    filterInput = ''

    constructor(private store: Store<any>,
                private toastService: ToastService,
                private sanitizer: DomSanitizer) {}

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

    deselectAllDisplayedRegions(regions, filterInputValue, deselectVisibleRegions){
        const filteredRegions = regions.filter(pf => pf.name.toLowerCase().includes(filterInputValue.toLowerCase()))
        this.filterInput = ''
        this.store.dispatch({
            type: SELECT_REGIONS,
            selectRegions: regions.filter(r => deselectVisibleRegions? !filteredRegions.includes(r) : filteredRegions.includes(r))
        })
    }

    regionColorAsBackground (region) {
        return this.sanitizer.bypassSecurityTrustStyle('background-color: rgb(' + region['rgb'][0] + ',' + region['rgb'][1] + ',' + region['rgb'][2] + ')')
    }
}
