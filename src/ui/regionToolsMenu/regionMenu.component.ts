import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {Observable} from "rxjs";
import {map, withLatestFrom} from "rxjs/operators";
import {FixedMouseContextualContainerDirective} from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import {VIEWER_STATE_ACTION_TYPES} from "src/services/effect/effect";
import {CHANGE_NAVIGATION, generateLabelIndexId} from "src/services/stateStore.service";
import {ADD_TO_REGIONS_SELECTION_WITH_IDS} from "src/services/state/viewerState.store";
import {Store} from "@ngrx/store";
import {SearchSideNav} from "src/ui/searchSideNav/searchSideNav.component";

@Component({
    selector: 'region-menu',
    templateUrl: './regionMenu.template.html',
    styleUrls: ['./regionMenu.style.css']
})
export class RegionMenuComponent {
    @Input() selectedRegions$: any
    @Input() region: any
    @Input() selectedTemplateName: string

    @Output() exploreConnectivity: EventEmitter<string> = new EventEmitter()

    @ViewChild('searchSideNav') searchSideNav: SearchSideNav

    regionToolsMenuVisible = true
    collapsedRegionDescription = false

    constructor(private store$: Store<any>) {}


    toggleRegionWithId(ngId, labelIndex, removeFlag: any){
        if (removeFlag) {
            this.store$.dispatch({
                type: VIEWER_STATE_ACTION_TYPES.DESELECT_REGIONS_WITH_ID,
                deselecRegionIds: [generateLabelIndexId({ ngId, labelIndex })]
            })
        } else {
            this.store$.dispatch({
                type: ADD_TO_REGIONS_SELECTION_WITH_IDS,
                selectRegionIds : [generateLabelIndexId({ ngId, labelIndex })]
            })
        }
    }

    regionIsSelected(selectedRegions, ngId, labelIndex) {
        return selectedRegions.map(sr => generateLabelIndexId({ ngId: sr.ngId, labelIndex: sr.labelIndex })).includes(generateLabelIndexId({ ngId, labelIndex }))
    }

    navigateTo(position){
        this.store$.dispatch({
            type: CHANGE_NAVIGATION,
            navigation: {
                position,
                animation: {}
            }
        })
    }
}