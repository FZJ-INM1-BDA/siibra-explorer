import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TRXBase } from "../trx.base";
import { AngularMaterialModule } from "src/sharedModules";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: 'trx-group-selector',
  templateUrl: './trxGrpSel.template.html',
  styleUrls: [
    './trxGrpSel.style.scss'
  ],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
  ]
})

export class TRXGroupSelector extends TRXBase {

  selectedGroup = new FormControl<string | null>(null)

  view$ = combineLatest([
    this.groupNames$
  ]).pipe(
    map(([groupNames]) => {
      return {
        groupNames
      }
    })
  )

  @Input()
  set selectGroup(val: string | null) {
    this.selectedGroup.setValue(val)
  }

  @Output()
  groupSelected = new EventEmitter<string|null>()

  constructor(){
    super()

    this.selectedGroup.valueChanges.subscribe(v => {
      this.groupSelected.emit(v)
      this.unloadGroup()
      if (v) {
        this.loadGroup(v)
      }
    })
  }
}