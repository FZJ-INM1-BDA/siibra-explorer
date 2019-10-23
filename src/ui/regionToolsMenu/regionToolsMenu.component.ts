import {AfterViewInit, Component, Input, ViewChild} from "@angular/core";
import {Observable} from "rxjs";
import {map, withLatestFrom} from "rxjs/operators";
import {FixedMouseContextualContainerDirective} from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import {VIEWER_STATE_ACTION_TYPES} from "src/services/effect/effect";
import {CHANGE_NAVIGATION, generateLabelIndexId} from "src/services/stateStore.service";
import {ADD_TO_REGIONS_SELECTION_WITH_IDS} from "src/services/state/viewerState.store";
import {Store} from "@ngrx/store";

@Component({
    selector: 'region-tools-menu',
    templateUrl: './regionToolsMenu.template.html',
    styleUrls: ['./regionToolsMenu.style.css']
})
export class RegionToolsMenuComponent implements AfterViewInit {
    @Input() mouseDownObs$: any
    @Input() clickObs$: any
    @Input() onhoverSegments$: any
    @Input() selectedRegions$: any

    @ViewChild(FixedMouseContextualContainerDirective) rClContextualMenu: FixedMouseContextualContainerDirective

    onhoverSegmentsForFixed$: Observable<any>

    regionToolsMenuVisible = false
    collapsedRegionId = -1

    constructor(private store$: Store<any>) {}

    ngAfterViewInit(): void {
        this.onhoverSegmentsForFixed$ = this.rClContextualMenu.onShow.pipe(
            withLatestFrom(this.onhoverSegments$),
            map(([_flag, onhoverSegments]) => onhoverSegments || [])
        )
    }


    mouseDownNehuba(event) {
        this.regionToolsMenuVisible = false
        this.rClContextualMenu.hide()
        this.collapsedRegionId = -1
    }

    mouseUpNehuba(event) {
        // if (this.mouseUpLeftPosition === event.pageX && this.mouseUpTopPosition === event.pageY) {}
        this.regionToolsMenuVisible = true
        if (!this.rClContextualMenu) return
        this.rClContextualMenu.mousePos = [
            event.clientX,
            event.clientY
        ]
        this.rClContextualMenu.show()
    }

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