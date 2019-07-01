import { Injectable } from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service"

@Injectable({ providedIn: 'root' })
export class ZipFileDownloadService {

    constructor(private constantService: AtlasViewerConstantsServices) {}

    /**
     * TODO make naming more generic
     */
    downloadZipFromKg(kgId: string, filename: string = 'download'){
        const _url = new URL(`${this.constantService.backendUrl}datasets/downloadKgFiles`)
        const searchParam = _url.searchParams
        searchParam.set('kgSchema', 'minds/core/dataset/v1.0.0')
        searchParam.set('kgId', kgId)
        return fetch(_url.toString())
            .then(res => {
                if (res.status >= 400) throw new Error(res.status.toString())
                return res.blob()
            })
            .then(data => this.simpleDownload(data, filename))
    }

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