import {
    Component,
    ElementRef, EventEmitter,
    HostListener,
    Inject,
    OnInit, Output,
    Renderer2,
    TemplateRef,
    ViewChild
} from "@angular/core";
import html2canvas from "html2canvas";
import {DOCUMENT} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";

@Component({
    selector: 'take-screenshot',
    templateUrl: './takeScreenshot.template.html',
    styleUrls: ['./takeScreenshot.style.css']
})
export class TakeScreenshotComponent implements OnInit {

    @ViewChild('downloadLink', {read: ElementRef}) downloadLink: ElementRef
    @ViewChild('screenshotPreviewCard', {read: ElementRef}) screenshotPreviewCard: ElementRef
    @ViewChild('previewImageDialog', {read: TemplateRef}) previewImageDialogTemplateRef : TemplateRef<any>
    @Output() focusSigninBaner = new EventEmitter()

    dialogRef

    takingScreenshot = false
    previewingScreenshot = false
    loadingScreenshot = false
    croppedCanvas = null

    mouseIsDown = false
    isDragging = false
    tookScreenShot = false // After the mouse is released
    // Used to calculate where to start showing the dragging area
    startX = 0
    startY = 0
    endX = 0
    endY = 0
    borderWidth = ''
    // The box that contains the border and all required numbers.
    boxTop = 0
    boxLeft = 0
    boxEndWidth = 0
    boxEndHeight = 0
    windowHeight = 0
    windowWidth = 0
    screenshotStartX = 0
    screenshotStartY = 0
    imageUrl

    constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: any, private matDialog: MatDialog) {}

    ngOnInit(): void {
        this.windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        this.windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        this.windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (this.takingScreenshot && event.key === 'Escape') {
            this.cancelTakingScreenshot()
        }
    }

    startScreenshot(){
        this.previewingScreenshot = false
        this.croppedCanvas = null
        this.loadingScreenshot = false
        this.takingScreenshot = true
    }

    move = (e) => {
        if (this.mouseIsDown) {
            this.isDragging = true

            this.endY = e.clientY
            this.endX = e.clientX

            if (this.endX >= this.startX && this.endY >= this.startY) {
                // III quadrant
                this.borderWidth = this.startY + 'px '
                    + (this.windowWidth - this.endX) + 'px '
                    + (this.windowHeight - this.endY) + 'px '
                    + this.startX + 'px'
                this.boxTop = this.startY
                this.boxLeft = this.startX
                this.boxEndWidth = this.endX - this.startX
                this.boxEndHeight = this.endY - this.startY

                this.screenshotStartX = this.startX
                this.screenshotStartY = this.startY

            } else if (this.endX <= this.startX && this.endY >= this.startY) {
                // IV quadrant

                this.borderWidth = this.startY + 'px '
                    + (this.windowWidth - this.startX) + 'px '
                    + (this.windowHeight - this.endY) + 'px '
                    + this.endX + 'px'

                this.boxLeft = this.endX
                this.boxTop = this.startY
                this.boxEndWidth = this.startX - this.endX
                this.boxEndHeight = this.endY - this.startY

                this.screenshotStartX = this.endX
                this.screenshotStartY = this.startY

            } else if (this.endX >= this.startX && this.endY <= this.startY) {

                // II quadrant

                this.borderWidth = this.endY + 'px '
                    + (this.windowWidth - this.endX) + 'px '
                    + (this.windowHeight - this.startY) + 'px '
                    + this.startX + 'px'

                this.boxLeft = this.startX
                this.boxTop = this.endY
                this.boxEndWidth = this.endX - this.startX
                this.boxEndHeight = this.startY - this.endY

                this.screenshotStartX = this.startX
                this.screenshotStartY = this.endY

            } else if (this.endX <= this.startX && this.endY <= this.startY) {
                // I quadrant

                this.boxLeft = this.endX
                this.boxTop = this.endY
                this.boxEndWidth = this.startX - this.endX
                this.boxEndHeight = this.startY - this.endY

                this.borderWidth = this.endY + 'px '
                    + (this.windowWidth - this.startX) + 'px '
                    + (this.windowHeight - this.startY) + 'px '
                    + this.endX + 'px'

                this.screenshotStartX = this.endX
                this.screenshotStartY = this.endY

            } else {
                this.isDragging = false
            }

        }
    }

    mouseDown = (e) => {
        this.borderWidth = this.windowWidth + 'px ' + this.windowHeight + 'px'

        this.startX = e.clientX
        this.startY = e.clientY


        this.mouseIsDown = true
        this.tookScreenShot = false
    }

    mouseUp = (e) => {
        this.borderWidth = '0'

        if (this.isDragging) {
            // Don't take the screenshot unless the mouse moved somehow.
            this.tookScreenShot = true
        }

        this.isDragging = false
        this.mouseIsDown = false

        this.loadingScreenshot = true
        this.takingScreenshot = false

        if (this.boxEndWidth * window.devicePixelRatio <= 1 && this.boxEndHeight * window.devicePixelRatio <= 1) {
            this.cancelTakingScreenshot()
        } else {
            this.takeScreenshot()
        }

    }

    takeScreenshot() {
        html2canvas(this.document.querySelector('#neuroglancer-container canvas')).then(canvas => {
            this.croppedCanvas = null
            this.croppedCanvas = this.renderer.createElement('canvas')

            this.croppedCanvas.width = this.boxEndWidth * window.devicePixelRatio
            this.croppedCanvas.height = this.boxEndHeight * window.devicePixelRatio

            this.croppedCanvas.getContext('2d')
                .drawImage(canvas,
                    this.screenshotStartX * window.devicePixelRatio, this.screenshotStartY * window.devicePixelRatio,
                    this.boxEndWidth * window.devicePixelRatio, this.boxEndHeight * window.devicePixelRatio,
                    0, 0,
                    this.boxEndWidth * window.devicePixelRatio, this.boxEndHeight * window.devicePixelRatio)
        }).then(() => {
            this.screenshotPreviewCard.nativeElement.click()
            this.loadingScreenshot = false
            this.imageUrl = this.croppedCanvas.toDataURL()
            this.previewingScreenshot = true
            this.clearStateAfterScreenshot()

            this.dialogRef = this.matDialog.open(this.previewImageDialogTemplateRef)
            this.dialogRef.afterClosed().toPromise()
                .then(result => {
                switch (result) {
                    case 'save': {
                        this.saveImage()
                        this.cancelTakingScreenshot()
                        break
                    }
                    case 'again': {
                        this.focusSigninBaner.emit()
                        this.startScreenshot()
                        break
                    }
                    case 'cancel': {
                        this.cancelTakingScreenshot()
                        break
                    }
                }
            })
        })
    }

    saveImage() {
        this.downloadLink.nativeElement.href = this.croppedCanvas.toDataURL('image/png')
        this.downloadLink.nativeElement.download = 'brain screenshot.png'
        this.downloadLink.nativeElement.click()
    }

    cancelTakingScreenshot() {
        this.takingScreenshot = false
        this.previewingScreenshot = false
        this.loadingScreenshot = false
        this.croppedCanvas = null
    }
    clearStateAfterScreenshot() {
        this.mouseIsDown = false
        this.isDragging = false
        this.tookScreenShot = false
        this.startX = 0
        this.startY = 0
        this.endX = 0
        this.endY = 0
        this.borderWidth = ''
        this.boxTop = 0
        this.boxLeft = 0
        this.boxEndWidth = 0
        this.boxEndHeight = 0
        this.windowHeight = 0
        this.windowWidth = 0
        this.screenshotStartX = 0
        this.screenshotStartY = 0
    }
}
