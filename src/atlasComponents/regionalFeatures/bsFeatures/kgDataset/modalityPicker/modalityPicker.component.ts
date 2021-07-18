import { Component, EventEmitter, Input, OnChanges, Output, Pipe, PipeTransform } from "@angular/core";
import { TCountedDataModality } from "../type";
import { ARIA_LABELS } from 'common/constants'


@Component({
  selector: 'modality-picker',
  templateUrl: './modalityPicker.template.html',
  styleUrls: [
    './modalityPicker.style.css',
  ],
  host:{
    'aria-label': ARIA_LABELS.LIST_OF_MODALITIES
  }
})

export class ModalityPicker implements OnChanges {

  public modalityVisibility: Set<string> = new Set()

  @Input()
  public countedDataM: TCountedDataModality[] = []

  public checkedModality: TCountedDataModality[] = []

  @Output()
  public modalityFilterEmitter: EventEmitter<TCountedDataModality[]> = new EventEmitter()

  // filter(dataentries:DataEntry[]) {
  //   return this.modalityVisibility.size === 0
  //     ? dataentries
  //     : dataentries.filter(de => de.activity.some(a => a.methods.some(m => this.modalityVisibility.has(this.dbService.temporaryFilterDataentryName(m)))))
  // }

  public ngOnChanges() {
    this.checkedModality = this.countedDataM.filter(d => d.visible)
  }

  /**
   * TODO
   * togglemodailty should emit event, and let parent handle state
   */
  public toggleModality(modality: Partial<TCountedDataModality>) {
    this.modalityFilterEmitter.emit(
      this.countedDataM.map(d => d.name === modality.name
        ? {
          ...d,
          visible: !d.visible,
        }
        : d),
    )
  }

  public uncheckModality(modality: string) {
    this.toggleModality({name: modality})
  }

  public clearAll() {
    this.modalityFilterEmitter.emit(
      this.countedDataM.map(d => {
        return {
          ...d,
          visible: false,
        }
      }),
    )
  }
}

const sortByFn = (a: TCountedDataModality, b: TCountedDataModality) => (a.name || '0').toLowerCase().charCodeAt(0) - (b.name || '0').toLowerCase().charCodeAt(0) 

@Pipe({
  name: 'sortModalityAlphabetically',
  pure: true
})

export class SortModalityAlphabeticallyPipe implements PipeTransform{
  public transform(arr: TCountedDataModality[]): TCountedDataModality[]{
    return [...arr].sort(sortByFn)
  }
}
