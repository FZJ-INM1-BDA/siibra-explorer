import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from "@angular/core";
import { Store } from "@ngrx/store";
import {MatMenuTrigger} from "@angular/material/menu";
import {Subscription} from "rxjs";
import { IavRootStoreInterface } from "src/services/stateStore.service";
import { RegionBase } from '../region.base'

@Component({
  selector: 'region-menu',
  templateUrl: './regionMenu.template.html',
  styleUrls: ['./regionMenu.style.css'],
})
export class RegionMenuComponent extends RegionBase implements OnInit, OnDestroy {

  @ViewChild('additionalActionsMenuButton', {read: MatMenuTrigger}) actionsMenuTriggerButton: MatMenuTrigger
  @ViewChild('additionalActionsPanel', {read: ElementRef}) additionalActionsPanelElement: ElementRef

  private subscriptions: Subscription[] = []

  constructor(
    store$: Store<IavRootStoreInterface>,
  ) {
    super(store$)
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.templateSelected$.subscribe(template => {
        this.selectedTemplate = template
      }),
      this.parcellationSelected$.subscribe(parcellation => {
        this.selectedParcellation = parcellation
      }),
      this.loadedTemplate$.subscribe(templates => {
        this.loadedTemplates = templates
        this.bigBrainJubrainSwitch()
        this.getSameParcellationTemplates()
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

}
