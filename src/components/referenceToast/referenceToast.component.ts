import { Component, Input, OnInit } from "@angular/core";
import { ZipFileDownloadService } from "src/services/zipFileDownload.service";

@Component({
    selector : 'reference-toast-component',
    templateUrl : './referenceToast.template.html',
    styleUrls : [
      `./referenceToast.style.css`
    ],
  })
export class ReferenceToastComponent implements OnInit{
    @Input() templateName? : string
    @Input() parcellationName? : string
    @Input() templateDescription? : string
    @Input() parcellationDescription? : string
    @Input() templatePublications? : any
    @Input() parcellationPublications? : any
    @Input() parcellationNifti? : any

    downloadingProcess = false
    niiFileSize = 0

    constructor(private zipFileDownloadService: ZipFileDownloadService) {}

    ngOnInit(): void {
        if (this.parcellationNifti) {
            this.parcellationNifti.forEach(nii => {
                this.niiFileSize += nii['size']
            })
        }
    }

    downloadPublications() {
        this.downloadingProcess = true

        let fileName = ''
        let publicationsText = ''

        if (this.templatePublications || this.templateDescription) {
          fileName += this.templateName? this.templateName : 'Template'

          if (this.templateDescription) {
            publicationsText += this.templateName + '\r\n'
            this.templateDescription.split(" ").forEach((word, index) => {
                publicationsText += word + ' '
                if (index && index%15 === 0) publicationsText += '\r\n'
            })
            publicationsText += '\r\n'
          }

          if (this.templatePublications) {
            if (!this.templateDescription) publicationsText += this.templateName   
            publicationsText += ' Publications:\r\n'
            this.templatePublications.forEach((tp, i) => {
              publicationsText += '\t' + (i+1) + '. ' + tp['citation'] + ' - ' + tp['doi'] + '\r\n'
            })
          }
        }

        if (this.parcellationPublications || this.parcellationDescription) {
            if (this.templateName) fileName += ' - ' 
            fileName += this.parcellationName? this.parcellationName : 'Parcellation' 
          if (this.templateDescription || this.templatePublications) publicationsText += '\r\n\r\n'
          
          if (this.parcellationDescription) {
            publicationsText += this.parcellationName + '\r\n'
            this.parcellationDescription.split(" ").forEach((word, index) => {
                publicationsText += word + ' '
                if (index && index%15 === 0) publicationsText += '\r\n'
            })  
            publicationsText += '\r\n'
          }

          if (this.parcellationPublications) {
            if (!this.parcellationDescription) publicationsText += this.parcellationName   
            publicationsText += ' Publications:\r\n'
            this.parcellationPublications.forEach((pp, i) => {
              publicationsText += '\t' + (i+1) + '. ' + pp['citation'] + ' - ' + pp['doi'] + '\r\n'
            })
          }
        }

        this.zipFileDownloadService.downloadZip(
            publicationsText,
            fileName,
            this.parcellationNifti? this.parcellationNifti : 0).subscribe(data => {
          this.downloadingProcess = false
        })
        publicationsText = ''
      }
}