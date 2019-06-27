import { Injectable } from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service"

@Injectable({ providedIn: 'root' })
export class ZipFileDownloadService {

    constructor(private constantService: AtlasViewerConstantsServices) {}

    /**
     * TODO make naming more generic
     */
    downloadZip(publicationsText, fileName, niiFiles) {
        const correctedName = fileName.replace(/[|&;$%@"<>()+,/]/g, "")
        const body = {
            fileName: correctedName,
            publicationsText: publicationsText,
            niiFiles: niiFiles === 0 ? null : niiFiles
        }
        const url = `${this.constantService.backendUrl}datasets/downloadParcellationThemself`

        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        })
        .then(res => res.blob())
        .then(data => {
            this.simpleDownload(data, correctedName)
        })
    }

    simpleDownload(data, filename) {
        const blob = new Blob([data], { type: 'application/zip'})
        const url= window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.download = filename + '.zip';
        anchor.href = url;
        anchor.click();
    }

    
}