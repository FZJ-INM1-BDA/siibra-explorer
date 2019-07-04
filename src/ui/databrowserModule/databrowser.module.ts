import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataBrowser } from "./databrowser/databrowser.component";
import { DatasetViewerComponent } from "./datasetViewer/datasetViewer.component";
import { ComponentsModule } from "src/components/components.module";
import { ModalityPicker } from "./modalityPicker/modalityPicker.component";
import { FormsModule } from "@angular/forms";
import { PathToNestedChildren } from "./util/pathToNestedChildren.pipe";
import { CopyPropertyPipe } from "./util/copyProperty.pipe";
import { FilterDataEntriesbyMethods } from "./util/filterDataEntriesByMethods.pipe";
import { FilterDataEntriesByRegion } from "./util/filterDataEntriesByRegion.pipe";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { PreviewComponent } from "./preview/preview.component";
import { FileViewer } from "./fileviewer/fileviewer.component";
import { RadarChart } from "./fileviewer/radar/radar.chart.component";
import { ChartsModule } from "ng2-charts";
import { LineChart } from "./fileviewer/line/line.chart.component";
import { DedicatedViewer } from "./fileviewer/dedicated/dedicated.component";
import { Chart } from 'chart.js'
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { PopoverModule } from "ngx-bootstrap/popover";
import { UtilModule } from "src/util/util.module";
import { AggregateArrayIntoRootPipe } from "./util/aggregateArrayIntoRoot.pipe";
import { KgSingleDatasetService } from "./kgSingleDatasetService.service"
import { SingleDatasetView } from './singleDataset/singleDataset.component'
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { DoiParserPipe } from "src/util/pipes/doiPipe.pipe";

@NgModule({
  imports:[
    ChartsModule,
    CommonModule,
    ComponentsModule,
    FormsModule,
    UtilModule,
    AngularMaterialModule,
    TooltipModule.forRoot(),
    PopoverModule.forRoot()
  ],
  declarations: [
    DataBrowser,
    DatasetViewerComponent,
    ModalityPicker,
    PreviewComponent,
    FileViewer,
    RadarChart,
    LineChart,
    DedicatedViewer,
    SingleDatasetView,

    /**
     * pipes
     */
    PathToNestedChildren,
    CopyPropertyPipe,
    FilterDataEntriesbyMethods,
    FilterDataEntriesByRegion,
    AggregateArrayIntoRootPipe,
    DoiParserPipe
  ],
  exports:[
    DataBrowser,
    SingleDatasetView
  ],
  entryComponents:[
    DataBrowser
  ],
  providers: [
    KgSingleDatasetService
  ]
  /**
   * shouldn't need bootstrap, so no need for browser module
   */
})

export class DatabrowserModule{
  constructor(
    constantsService:AtlasViewerConstantsServices
  ){
    /**
     * Because there is no easy way to display standard deviation natively, use a plugin 
     * */
    Chart.pluginService.register({

      /* patching background color fill, so saved images do not look completely white */
      beforeDraw: (chart) => {
        const ctx = chart.ctx as CanvasRenderingContext2D;
        ctx.fillStyle = constantsService.darktheme ?
          `rgba(50,50,50,0.8)` :
          `rgba(255,255,255,0.8)`

        if (chart.canvas) ctx.fillRect(0, 0, chart.canvas.width, chart.canvas.height)

      },

      /* patching standard deviation for polar (potentially also line/bar etc) graph */
      afterInit: (chart) => {
        if (chart.config.options && chart.config.options.tooltips) {

          chart.config.options.tooltips.callbacks = {
            label: function (tooltipItem, data) {
              let sdValue
              if (data.datasets && typeof tooltipItem.datasetIndex != 'undefined' && data.datasets[tooltipItem.datasetIndex].label) {
                const sdLabel = data.datasets[tooltipItem.datasetIndex].label + '_sd'
                const sd = data.datasets.find(dataset => typeof dataset.label != 'undefined' && dataset.label == sdLabel)
                if (sd && sd.data && typeof tooltipItem.index != 'undefined' && typeof tooltipItem.yLabel != 'undefined') sdValue = Number(sd.data[tooltipItem.index]) - Number(tooltipItem.yLabel)
              }
              return `${tooltipItem.yLabel} ${sdValue ? '(' + sdValue + ')' : ''}`
            }
          }
        }
        if (chart.data.datasets) {
          chart.data.datasets = chart.data.datasets
            .map(dataset => {
              if (dataset.label && /\_sd$/.test(dataset.label)) {
                const originalDS = chart.data.datasets!.find(baseDS => typeof baseDS.label !== 'undefined' && (baseDS.label == dataset.label!.replace(/_sd$/, '')))
                if (originalDS) {
                  return Object.assign({}, dataset, {
                    data: (originalDS.data as number[]).map((datapoint, idx) => (Number(datapoint) + Number((dataset.data as number[])[idx]))),
                    ... constantsService.chartSdStyle
                  })
                } else {
                  return dataset
                }
              } else if (dataset.label) {
                const sdDS = chart.data.datasets!.find(sdDS => typeof sdDS.label !== 'undefined' && (sdDS.label == dataset.label + '_sd'))
                if (sdDS) {
                  return Object.assign({}, dataset, {
                    ...constantsService.chartBaseStyle
                  })
                } else {
                  return dataset
                }
              } else {
                return dataset
              }
            })
        }
      }
    })
  }
}