import { Component, EventEmitter, Input, OnChanges, Output, Pipe, PipeTransform } from "@angular/core";
import { CountedDataModality } from "../databrowser.service";

@Component({
  selector: 'modality-picker',
  templateUrl: './modalityPicker.template.html',
  styleUrls: [
    './modalityPicker.style.css',
  ],
})

export class ModalityPicker implements OnChanges {

  public modalityVisibility: Set<string> = new Set()

  @Input()
  public countedDataM: CountedDataModality[] = []

  public checkedModality: CountedDataModality[] = []

  @Output()
  public modalityFilterEmitter: EventEmitter<CountedDataModality[]> = new EventEmitter()

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
  public toggleModality(modality: Partial<CountedDataModality>) {
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

const sortByFn = (a: CountedDataModality, b: CountedDataModality) => (a.name || '0').toLowerCase().charCodeAt(0) - (b.name || '0').toLowerCase().charCodeAt(0) 

@Pipe({
  name: 'sortModalityAlphabetically',
  pure: true
})

export class SortModalityAlphabeticallyPipe implements PipeTransform{
  public transform(arr: CountedDataModality[]): CountedDataModality[]{
    return [...arr].sort(sortByFn)
  }
}
