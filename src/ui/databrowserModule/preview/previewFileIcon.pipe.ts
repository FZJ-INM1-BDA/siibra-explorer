import { Pipe, PipeTransform } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";

@Pipe({
  name: 'previewFileIconPipe',
})

export class PreviewFileIconPipe implements PipeTransform {
  public transform(previewFile: ViewerPreviewFile): {fontSet: string, fontIcon: string} {
    const type = determinePreviewFileType(previewFile)
    if (type === PREVIEW_FILE_TYPES.NIFTI) { return {
      fontSet: 'fas',
      fontIcon: 'fa-brain',
    }
    }

    if (type === PREVIEW_FILE_TYPES.IMAGE) { return {
      fontSet: 'fas',
      fontIcon: 'fa-image',
    }
    }

    if (type === PREVIEW_FILE_TYPES.CHART) { return {
      fontSet: 'far',
      fontIcon: 'fa-chart-bar',
    }
    }

    return {
      fontSet: 'fas',
      fontIcon: 'fa-file',
    }
  }
}

export const determinePreviewFileType = (previewFile: ViewerPreviewFile) => {
  if (!previewFile) return null
  const { mimetype, data } = previewFile
  const chartType = data && data['chart.js'] && data['chart.js'].type
  if ( mimetype === 'application/nifti' ) { return PREVIEW_FILE_TYPES.NIFTI }
  if ( /^image/.test(mimetype)) { return PREVIEW_FILE_TYPES.IMAGE }
  if ( /application\/json/.test(mimetype) && (chartType === 'line' || chartType === 'radar')) { return PREVIEW_FILE_TYPES.CHART }
  return PREVIEW_FILE_TYPES.OTHER
}

export const PREVIEW_FILE_TYPES = {
  NIFTI: 'NIFTI',
  IMAGE: 'IMAGE',
  CHART: 'CHART',
  OTHER: 'OTHER',
}
