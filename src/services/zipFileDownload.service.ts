import { Injectable } from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";

@Injectable({ providedIn: 'root' })
export class ZipFileDownloadService {

    constructor(private httpClient: HttpClient, private constantService: AtlasViewerConstantsServices) {}

    downloadZip(publicationsText, fileName) {
        const correctedName = fileName.replace(/[|&;$%@"<>()+,/]/g, "")
        this.httpClient.post(this.constantService.backendUrl + 'datasets/downloadParcellationThemself', {
                fileName: correctedName,
                publicationsText: publicationsText,
            },{responseType: "text"}
        ).subscribe(data => {
            this.downloadFile(data, correctedName)
        })
    }

    downloadFile(data, fileName) {

        const contentType = 'application/zip';
        const b64Data = data


        const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
            const byteCharacters = atob(b64Data);
            const byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                const slice = byteCharacters.slice(offset, offset + sliceSize);

                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, {type: contentType});
            return blob;
        }


        const blob = b64toBlob(b64Data, contentType);
        // const blob = new Blob([data], { type: 'text/csv' });
        const url= window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.download = fileName + '.zip';
        anchor.href = url;
        anchor.click();
    }


}