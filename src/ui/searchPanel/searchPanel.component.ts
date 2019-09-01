import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from "@angular/core";
import {merge, Observable, Subscription} from "rxjs";
import {select, Store} from "@ngrx/store";
import {DataEntry, safeFilter} from "src/services/stateStore.service";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {CountedDataModality, DatabrowserService} from "src/ui/databrowserModule/databrowser.service";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";

@Component({
    selector: 'search-panel',
    templateUrl: './searchPanel.template.html',
    styleUrls: ['./searchPanel.style.css']
})

export class SearchPanel implements OnInit, OnDestroy {
    @Input() selectedTemplate$: Observable<any>
    @Input() selectedParcellation$: Observable<any>
    @Input() selectedRegions$: Observable<any>
    @Input() searchPanelPositionTop
    selectedTemplate
    selectedParcellation

    @Output() searchedItemsNumber: EventEmitter<number> = new EventEmitter()
    @Output() searchLoading: EventEmitter<boolean> = new EventEmitter()
    @Output() freezeSearchMenu: EventEmitter<boolean> = new EventEmitter()
    @Output() filePreviewModalClosed: EventEmitter<boolean> = new EventEmitter()

    public dataentries: DataEntry[] = []
    public countedDataM: CountedDataModality[] = []
    public visibleCountedDataM: CountedDataModality[] = []
    public fetchingFlag: boolean = false
    public fetchError: boolean = false
    private subscriptions: Subscription[] = []

    showPreview: number = null
    previewWindowTopPosition
    windowInnerheight

    filesMenuFrozen
    filePreviewModalClosedValue = false
    showSelectedRegions = false

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.windowInnerheight = event.target.innerHeight
    }

    setPreviewHeight(searchBody, searchItem) {
        this.previewWindowTopPosition = +searchItem.offsetTop - +searchBody.scrollTop - +this.searchPanelPositionTop + 132
        setTimeout(() => {
                if (this.searchPreview) {
                    if ((+this.previewWindowTopPosition + +this.searchPreview.nativeElement.offsetHeight + +this.searchPanelPositionTop) > window.innerHeight) {
                        this.previewWindowTopPosition -= ((+this.previewWindowTopPosition + +this.searchPreview.nativeElement.offsetHeight + +this.searchPanelPositionTop)-window.innerHeight)+10
                    }
                }
            }, 100)
    }

    @ViewChild('SearchBody', {read: ElementRef}) searchBody: ElementRef
    @ViewChild('SearchPreview', {read: ElementRef}) searchPreview: ElementRef

    constructor(private store: Store<any>,
                private dbService: DatabrowserService,
                private constantsService: AtlasViewerConstantsServices) {
        this.windowInnerheight = window.innerHeight
    }

    ngOnInit(): void {
        this.subscriptions.push(
            this.selectedTemplate$.subscribe(template => {
                this.selectedTemplate = template
            })
        )
        this.subscriptions.push(
            this.selectedParcellation$.subscribe(parcellation => {
                this.clearSearchResults()
                this.selectedParcellation = parcellation
            })
        )

        // ToDo Put saved selections instead of selected regions
        this.subscriptions.push(
            this.selectedRegions$.subscribe(r => {
                if (this.searchBody && this.searchBody.nativeElement) {
                    this.searchBody.nativeElement.scrollTop = 0
                }
                if (r && r.length && this.selectedTemplate && this.selectedParcellation && this.selectedParcellation.regions) {
                    this.loadKGSearchData(this.selectedTemplate, this.selectedParcellation, r)
                } else {
                    this.clearSearchResults()
                }
            })
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe())
    }

    loadKGSearchData(template, parcellation, regions: any = '') {
        if (regions) {
            regions = regions.map(r => {
                /**
                 * TODO to be replaced with properly region UUIDs from KG
                 */
                return {
                    id: `${this.selectedParcellation.name}/${r.name}`,
                    ...r
                }
            })
        }
            this.fetchingFlag = true
            this.searchLoading.emit(true)
            this.dbService.getDataByRegion({regions, parcellation, template})
                .then(de => {
                    this.dataentries = de
                    return de
                })
                .then(this.dbService.getModalityFromDE)
                .then(modalities => {
                    this.countedDataM = modalities
                })
                .catch(e => {
                    this.fetchError = true
                })
                .finally(() => {
                    if (this.dataentries && this.dataentries.length)
                        this.fetchError = false
                    this.searchedItemsNumber.emit(this.dataentries.length)
                    this.fetchingFlag = false
                    this.searchLoading.emit(false)
                })


            this.subscriptions.push(
                merge(
                    this.dbService.fetchDataObservable$
                ).subscribe(() => {
                    this.clearAll()
                })
            )

    }

    openDatasetUrl(url) {
        window.open('https://doi.org/' + url, "_blank");
    }

    retryFetchData(event: MouseEvent){
        event.preventDefault()
        this.dbService.manualFetchDataset$.next(null)
    }

    resetFilters(event?:MouseEvent){
        this.clearAll()
    }

    clearAll(){
        this.countedDataM = this.countedDataM.map(cdm => {
            return {
                ...cdm,
                visible: false
            }
        })
        this.visibleCountedDataM = []
    }

    clearSearchResults() {
        this.dataentries = []
        this.countedDataM = []
        this.visibleCountedDataM = []
        this.fetchingFlag = false
        this.fetchError = false
        this.searchedItemsNumber.emit(this.dataentries.length)
    }

    handleModalityFilterEvent(modalityFilter:CountedDataModality[]){
        this.countedDataM = modalityFilter
        this.visibleCountedDataM = modalityFilter.filter(dm => dm.visible)
    }

    frozeSearchMenu() {
        this.freezeSearchMenu.emit(true)
        this.filesMenuFrozen = true
    }

    unfrozeSearchMenu() {
        this.filesMenuFrozen = false
        this.freezeSearchMenu.emit(false)
    }
    closeFrozenMenu() {
        console.log('Close menu')
        this.filePreviewModalClosedValue = false
        this.filesMenuFrozen = false
    }
}
