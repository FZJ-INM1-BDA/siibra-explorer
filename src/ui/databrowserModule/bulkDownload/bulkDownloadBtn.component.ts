import { Component, Input, OnChanges, Pipe, PipeTransform, ChangeDetectionStrategy } from "@angular/core";
import { AtlasViewerConstantsServices } from "../singleDataset/singleDataset.base";
import { IDataEntry } from "src/services/stateStore.service";
import { getKgSchemaIdFromFullId } from "../util/getKgSchemaIdFromFullId.pipe";

const ARIA_LABEL_HAS_DOWNLOAD = `Bulk download all favourited datasets`
const ARIA_LABEL_HAS_NO_DOWNLOAD = `No favourite datasets to download`

@Component({
  selector: 'iav-datamodule-bulkdownload-cmp',
  templateUrl: './bulkDownloadBtn.template.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BulkDownloadBtn implements OnChanges{
  @Input()
  kgSchema = 'minds/core/dataset/v1.0.0'

  @Input()
  kgIds: string[] = []

  public postUrl: string
  public stringifiedKgIds: string = `[]`
  public ariaLabel = ARIA_LABEL_HAS_DOWNLOAD

  constructor(
    constantService: AtlasViewerConstantsServices
  ){
    const _url = new URL(`datasets/bulkDownloadKgFiles`, constantService.backendUrl)
    this.postUrl = _url.toString()
  }

  ngOnChanges(){
    this.stringifiedKgIds = JSON.stringify(this.kgIds)
    this.ariaLabel = this.kgIds.length === 0
      ? ARIA_LABEL_HAS_NO_DOWNLOAD
      : ARIA_LABEL_HAS_DOWNLOAD
  }
}

@Pipe({
  name: 'iavDatamoduleTransformDsToIdPipe'
})

export class TransformDatasetToIdPipe implements PipeTransform{
  public transform(datasets: IDataEntry[]): string[]{
    return datasets.map(({ fullId }) => {
      const re = getKgSchemaIdFromFullId(fullId)
      if (re) return re[1]
      else return null
    })
  }
}
