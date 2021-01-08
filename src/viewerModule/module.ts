import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AtlasCmptConnModule } from "src/atlasComponents/connectivity";
import { DatabrowserModule } from "src/atlasComponents/databrowserModule";
import { AtlasCmpParcellationModule } from "src/atlasComponents/parcellation";
import { ParcellationRegionModule } from "src/atlasComponents/parcellationRegion";
import { SplashUiModule } from "src/atlasComponents/splashScreen";
import { AtlasCmpUiSelectorsModule } from "src/atlasComponents/uiSelectors";
import { ComponentsModule } from "src/components";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { TopMenuModule } from "src/ui/topMenu/module";
import { UtilModule } from "src/util";
import { NehubaModule } from "./nehuba";
import { RegionAccordionTooltipTextPipe } from "./util/regionAccordionTooltipText.pipe";
import { ViewerCmp } from "./viewerCmp/viewerCmp.component";

@NgModule({
  imports: [
    CommonModule,
    NehubaModule,
    LayoutModule,
    DatabrowserModule,
    AtlasCmpUiSelectorsModule,
    AngularMaterialModule,
    SplashUiModule,
    TopMenuModule,
    ParcellationRegionModule,
    UtilModule,
    AtlasCmpParcellationModule,
    AtlasCmptConnModule,
    ComponentsModule,
  ],
  declarations: [
    ViewerCmp,

    RegionAccordionTooltipTextPipe,
  ],
  exports: [
    ViewerCmp,
  ],
})

export class ViewerModule{}

/**
    <ui-nehuba-container
      class="z-index-10"
      #uiNehubaContainer="uiNehubaContainer"
      iav-mouse-hover
      #iavMouseHoverEl="iavMouseHover"
      [currentOnHoverObs$]="iavMouseHoverEl.currentOnHoverObs$"
      [currentOnHover]="iavMouseHoverEl.currentOnHoverObs$ | async"
      iav-captureClickListenerDirective
      [iav-captureClickListenerDirective-captureDocument]="true"
      (iav-captureClickListenerDirective-onUnmovedClick)="mouseClickDocument($event)"
      (drag-drop)="localFileService.handleFileDrop($event)">

      <!-- top right content transclusion -->
      <div ui-nehuba-container-overlay-top-right class="d-inline-flex flex-row justify-content-end align-items-start z-index-6 position-absolute pe-none w-100 h-100">

        <top-menu-cmp
          class="mt-3 mr-2"
          [parcellationIsSelected]="!!selectedParcellation"
          [ismobile]="(media.mediaBreakPoint$ | async) > 3">
        </top-menu-cmp>

        <!-- atlas selector -->
        <div *ngIf="uiNehubaContainer.viewerLoaded"
          class="iv-custom-comp bg card m-2 mat-elevation-z2">
          <atlas-dropdown-selector class="pe-all mt-2">
          </atlas-dropdown-selector>
        </div>

      </div>

      <!-- bottom left content transclusion -->
      <div ui-nehuba-container-overlay-bottom-left class="d-inline-flex pe-none w-100 align-items-end m-2 mb-4">

        <!-- only load atlas layer selector and chips if viewer is loaded -->
        <ng-template [ngIf]="uiNehubaContainer.viewerLoaded  && !(isStandaloneVolumes$ | async)">

          <!-- Viewer Selector Container-->
          <atlas-layer-selector
            #alSelector="atlasLayerSelector"
            class="pe-all"
            (iav-outsideClick)="alSelector.selectorExpanded = false">
          </atlas-layer-selector>
          <mat-chip-list class="mb-2">
            <!-- additional layer -->

            <ng-container>
              <ng-container *ngTemplateOutlet="currParcellationTmpl; context: { addParc: (selectedAdditionalLayers$ | async), parc: selectedParcellation }">
              </ng-container>
            </ng-container>

            <!-- any selected region(s) -->
            <ng-container>
              <ng-container *ngTemplateOutlet="selectedRegionTmpl">
              </ng-container>
            </ng-container>

            <!-- controls for iav volumes -->
            <div class="hidden" iav-shown-previews #previews="iavShownPreviews"></div>
            <ng-container *ngTemplateOutlet="selectedDatasetPreview; context: { layers: previews.iavAdditionalLayers$ | async | filterPreviewByType : [previews.FILETYPES.VOLUMES] }">
            </ng-container>

          </mat-chip-list>

          <!-- current layer tmpl -->

          <ng-template #currParcellationTmpl let-parc="parc" let-addParc="addParc">

            <div [matMenuTriggerFor]="layerVersionMenu"
              [matMenuTriggerData]="{ layerVersionMenuTrigger: layerVersionMenuTrigger }"
              #layerVersionMenuTrigger="matMenuTrigger">

              <ng-template [ngIf]="addParc.length > 0" [ngIfElse]="defaultParcTmpl">
                <ng-container *ngFor="let p of addParc">
                  <ng-container *ngTemplateOutlet="chipTmpl; context: {
                    parcel: p,
                    selected: true,
                    dismissable: true,
                    onclick: layerVersionMenuTrigger.toggleMenu.bind(layerVersionMenuTrigger)
                  }">
                  </ng-container>
                </ng-container>
              </ng-template>
              <ng-template #defaultParcTmpl>
                <ng-container *ngTemplateOutlet="chipTmpl; context: {
                  parcel: parc,
                  selected: false,
                  dismissable: false,
                  onclick: layerVersionMenuTrigger.toggleMenu.bind(layerVersionMenuTrigger)
                }">
                </ng-container>
              </ng-template>
            </div>
          </ng-template>

          <!-- render parc templ -->
          <ng-template #chipTmpl
            let-parcel="parcel"
            let-selected="selected"
            let-dismissable="dismissable"
            let-chipClass="class"
            let-onclick="onclick">
            <mat-chip class="pe-all position-relative z-index-2 d-inline-flex justify-content-between"
              [ngClass]="chipClass"
              (click)="onclick && onclick()"
              [selected]="selected">

              <span>
                {{ parcel?.groupName ? (parcel?.groupName + ' - ') : '' }}{{ parcel && (parcel.displayName || parcel.name) }}
              </span>

              <!-- info icon -->
              <ng-template [ngIf]="parcel?.originDatasets?.length > 0" [ngIfElse]="infoIconBasic">

                <mat-icon
                  *ngFor="let ds of parcel.originDatasets"
                  fontSet="fas"
                  fontIcon="fa-info-circle"
                  iav-stop="click"
                  iav-dataset-show-dataset-dialog
                  [iav-dataset-show-dataset-dialog-kgid]="ds['kgId']"
                  [iav-dataset-show-dataset-dialog-kgschema]="ds['kgSchema']"
                  [iav-dataset-show-dataset-dialog-name]="parcel?.properties?.name"
                  [iav-dataset-show-dataset-dialog-description]="parcel?.properties?.description">
                </mat-icon>

              </ng-template>

              <ng-template #infoIconBasic>
                <mat-icon *ngIf="parcel?.properties?.name && parcel?.properties?.description"
                  fontSet="fas"
                  fontIcon="fa-info-circle"
                  iav-stop="click"
                  iav-dataset-show-dataset-dialog
                  [iav-dataset-show-dataset-dialog-name]="parcel.properties.name"
                  [iav-dataset-show-dataset-dialog-description]="parcel.properties.description">

                </mat-icon>
              </ng-template>

              <!-- dismiss icon -->
              <mat-icon
                *ngIf="dismissable"
                (click)="clearAdditionalLayer(parcel); $event.stopPropagation()"
                fontSet="fas"
                fontIcon="fa-times">
              </mat-icon>
            </mat-chip>
          </ng-template>

          <!-- layer version selector -->
          <mat-menu #layerVersionMenu
            class="bg-none box-shadow-none"
            [hasBackdrop]="false">
            <ng-template matMenuContent let-layerVersionMenuTrigger="layerVersionMenuTrigger">
              <div (iav-outsideClick)="layerVersionMenuTrigger.closeMenu()">
                <ng-container *ngFor="let parcVer of selectedLayerVersions$ | async">
                  <ng-container *ngTemplateOutlet="chipTmpl; context: {
                    parcel: parcVer,
                    selected: selectedParcellation && selectedParcellation['@id'] === parcVer['@id'],
                    dismissable: false,
                    class: 'w-100',
                    onclick: bindFns([
                      [ selectParcellation.bind(this), parcVer ],
                      [ layerVersionMenuTrigger.closeMenu.bind(layerVersionMenuTrigger) ]
                    ])
                  }">
                  </ng-container>
                  <div class="mt-1"></div>
                </ng-container>
              </div>
            </ng-template>
          </mat-menu>

          <ng-template #selectedRegionTmpl>

            <!-- regions chip -->
            <ng-template [ngIf]="selectedRegions$ | async" let-selectedRegions="ngIf">
              <!-- if regions.length > 1 -->
              <!-- use group chip -->
              <ng-template [ngIf]="selectedRegions.length > 1" [ngIfElse]="singleRegionTmpl">
                <mat-chip
                  color="primary"
                  selected
                  (click)="uiNehubaContainer.matDrawerMinor.open() && uiNehubaContainer.navSideDrawerMainSwitch.open()"
                  class="pe-all position-relative z-index-1 ml-8-n">
                  <span class="iv-custom-comp text text-truncate d-inline pl-4">
                    {{ CONST.MULTI_REGION_SELECTION }}
                  </span>
                  <mat-icon
                    (click)="clearSelectedRegions()"
                    fontSet="fas"
                    iav-stop="click"
                    fontIcon="fa-times">
                  </mat-icon>
                </mat-chip>
              </ng-template>

              <!-- if reginos.lengt === 1 -->
              <!-- use single region chip -->
              <ng-template #singleRegionTmpl>
                <ng-container *ngFor="let r of selectedRegions">

                  <!-- region chip for discrete map -->
                  <mat-chip
                    iav-region
                    (click)="uiNehubaContainer.matDrawerMinor.open() && uiNehubaContainer.navSideDrawerMainSwitch.open()"
                    [region]="r"
                    class="pe-all position-relative z-index-1 ml-8-n"
                    [ngClass]="{
                      'darktheme':regionDirective.rgbDarkmode === true,
                      'lighttheme': regionDirective.rgbDarkmode === false
                    }"
                    [style.backgroundColor]="regionDirective.rgbString"
                    #regionDirective="iavRegion">
                    <span class="iv-custom-comp text text-truncate d-inline pl-4">
                      {{ r.name }}
                    </span>
                    <mat-icon
                      class="iv-custom-comp text"
                      (click)="clearSelectedRegions()"
                      fontSet="fas"
                      iav-stop="click"
                      fontIcon="fa-times">
                    </mat-icon>
                  </mat-chip>
    
                  <!-- chips for previewing origin datasets/continous map -->
                  <ng-container *ngFor="let originDataset of (r.originDatasets || []); let index = index">
                    <div class="hidden"
                      iav-dataset-preview-dataset-file
                      [iav-dataset-preview-dataset-file-kgid]="originDataset.kgId"
                      [iav-dataset-preview-dataset-file-filename]="originDataset.filename"
                      #previewDirective="iavDatasetPreviewDatasetFile">
                    </div>
                    <mat-chip *ngIf="previewDirective.active"
                      (click)="uiNehubaContainer.matDrawerMinor.open() && uiNehubaContainer.navSideDrawerMainSwitch.open()"
                      class="pe-all position-relative ml-8-n">
                      <span class="pl-4">
                        {{ regionDirective.regionOriginDatasetLabels$ | async | renderViewOriginDatasetlabel : index }}
                      </span>
                      <mat-icon (click)="previewDirective.onClick()"
                        fontSet="fas"
                        iav-stop="click"
                        fontIcon="fa-times">
                      </mat-icon>
                    </mat-chip>
    
                    <mat-chip *ngFor="let key of clearViewKeys$ | async"
                      (click)="uiNehubaContainer.matDrawerMinor.open() && uiNehubaContainer.navSideDrawerMainSwitch.open()"
                      class="pe-all position-relative ml-8-n">
                      <span class="pl-4">
                        {{ key }}
                      </span>
                      <mat-icon (click)="unsetClearViewByKey(key)"
                        fontSet="fas"
                        iav-stop="click"
                        fontIcon="fa-times">
    
                      </mat-icon>
                    </mat-chip>
                  </ng-container>
    
                </ng-container>
              </ng-template>
            </ng-template>

          </ng-template>

          <ng-template #selectedDatasetPreview let-layers="layers">

            <ng-container *ngFor="let layer of layers">
              <div class="hidden"
                iav-dataset-preview-dataset-file
                [iav-dataset-preview-dataset-file-kgid]="layer.datasetId"
                [iav-dataset-preview-dataset-file-filename]="layer.filename"
                #preview="iavDatasetPreviewDatasetFile">

              </div>
              <mat-chip class="pe-all"
                (click)="uiNehubaContainer.matDrawerMinor.open() && uiNehubaContainer.navSideDrawerMainSwitch.open()">
                {{ layer.file?.name || layer.filename || 'Unknown data preview' }}
                <mat-icon fontSet="fas" fontIcon="fa-times"
                  (click)="preview.onClick()"
                  iav-stop="click">
                </mat-icon>
              </mat-chip>
            </ng-container>
          </ng-template>

        </ng-template>
      </div>

      <!-- top left content transclusion -->
      <div ui-nehuba-container-overlay-top-left class="d-inline-flex pe-none w-100 align-items-start m-2">
        <ui-status-card
          *ngIf="uiNehubaContainer.viewerLoaded"
          class="pe-all muted-7"
          [selectedTemplateName]="uiNehubaContainer?.selectedTemplate?.name"
          [nehubaViewer]="uiNehubaContainer?.nehubaViewer">
        </ui-status-card>
      </div>
    </ui-nehuba-container>
 */