import { Injectable } from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";

@Injectable({ providedIn: 'root' })
export class ZipFileDownloadService {

    constructor(private httpClient: HttpClient, private constantService: AtlasViewerConstantsServices) {}

    downloadZip(publicationsText, fileName) {
        const correctedName = fileName.replace(/[|&;$%@"<>()+,/]/g, "")
        console.log(correctedName)
        this.httpClient.post(this.constantService.backendUrl + 'datasets/downloadParcellationThemself', {
                fileName: correctedName,
                publicationsText: publicationsText,
            },{responseType: "blob"}
        ).subscribe(data => {
            console.log(data)
            this.downloadFile(data, correctedName)
        })
    }

    downloadFile(data, fileName) {
        const blob = new Blob([data], { type: 'text/csv' });
        const url= window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.download = fileName + '.zip';
        anchor.href = url;
        anchor.click();
    }


}