import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })

export class ZipFileDownloadService {
    saveTextAsFile(data, filename) {

        if (!data) {
            console.error('Console.save: No data')
            return;
        }
        if (!filename) filename = 'Publication.json'

        var blob = new Blob([data], { type: 'text/plain' }),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a')
        // FOR IE:

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
        }
        else {
            var e = document.createEvent('MouseEvents'),
                a = document.createElement('a');

            a.download = filename;
            a.href = window.URL.createObjectURL(blob);
            a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
            e.initEvent('click', true, false);
            a.dispatchEvent(e);
        }
    }
}