import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ViewChild, TemplateRef } from "@angular/core";
import { ToastService } from "src/services/toastService.service";
import { ZipFileDownloadService } from "src/services/zipFileDownload.service";

@Component({
  selector: 'radio-list',
  templateUrl: './radiolist.template.html',
  styleUrls: [
    './radiolist.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RadioList{
  @Input() 
  listDisplay : (item:any) => string = (obj) => obj.name

  @Output()
  itemSelected : EventEmitter<any> = new EventEmitter()

  @Input()
  selectedItem: any | null = null

  @Input()
  inputArray: any[] = []

  @Input()
  ulClass: string = ''
  
  @Input() checkSelected: (selectedItem:any, item:any) => boolean = (si,i) => si === i

  @Input() isMobile: boolean
  @Input() darktheme: boolean

  @ViewChild('publicationTemplate',{read:TemplateRef} ) publicationTemplate: TemplateRef<any>

  handleToast: any
  choosenItem: number

  constructor(private toastService: ToastService,
              private zipFileDownloadService: ZipFileDownloadService) {}

  showToast(index) {
    this.choosenItem = index
    if (this.handleToast) {
      this.handleToast()
      this.handleToast = null
    }
    this.handleToast = this.toastService.showToast(this.publicationTemplate, {
        timeout: 7000
    })
  }

  overflowText(event) {
    return (event.offsetWidth < event.scrollWidth);
  }
}