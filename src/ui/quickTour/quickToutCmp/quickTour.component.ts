import {AfterViewInit, Component, EventEmitter, HostListener, OnDestroy, Output} from "@angular/core";

@Component({
  selector : 'quick-tour',
  templateUrl : './quickTour.temlate.html',
  styleUrls : ['./quickTour.style.css',],
})
export class QuickTourComponent implements AfterViewInit, OnDestroy {

  @Output() destroy = new EventEmitter()
  public currentTip = 0
  public numberOfSteps = null
  private observers: any[] = []

  public slides: any[] = [
    {
      description: 'This is the atlas selector. Click here to choose between EBRAINS reference atlases of different species.',
      tooltipRight: '10px',
      tooltipTop: '65px',
      arrowPosition: 'top',
      arrowMargin: '0 0 0 60%',
      arrow: 'arrow1',

      step: 1,
    },

    {
      description: 'The planar views allow you to zoom in to full resolution (mouse wheel), pan the view (click+drag), and select oblique sections (shift+click+drag). You can double-click brain regions to select them.',
      tooltipLeft: 'calc(50% - 50px)',
      tooltipTop: 'calc(50% - 50px)',
      arrowPosition: 'top',
      arrow: 'arrow5',
      textMargin: '-60px 0px 0px 45px',

      step: 2,
    },
    {
      description: 'The 3D view gives an overview of the brain with limited resolution. It can be independently rotated. Click the „eye“ icon on the bottom left to toggle pure surface view.',
      tooltipLeft: 'calc(50% - 300px)',
      tooltipTop: 'calc(50% - 160px)',
      arrowPosition: 'bottom',
      arrow: 'arrow6',
      arrowMargin: '-10 0 0 calc(100% + 10px)',
      arrowTransform: 'rotate(130deg)',
      step: 3,
    },

    {
      description: 'Use these icons in any of the views to maximize it and zoom in/out.',
      tooltipRight: '122px',
      tooltipTop: 'calc(50% - 28px)',
      arrowPosition: 'top',
      arrowMargin: '0 100% -8px calc(100% + 5px)',
      arrow: 'arrow6',

      arrowTransform: 'rotate(40deg)',

      step: 4,
    },

    {
      description: 'This is the atlas layer browser. If an atlas supports multiple template spaces or parcellation maps, you will find them here.',
      tooltipLeft: '18px',
      tooltipTop: 'calc(100vh - 230px)',
      arrow: 'arrow2',
      arrowMargin: '100% 0px 0px 0px',
      arrowPosition: 'left',
      autoNext: 'layerSelectorOpened',
      viewAttached: 'sidebarRegion',
      step: 5,
    },

    {
      description: 'Choose other available templates or parcellations here.',
      tooltipLeft: '300px',
      tooltipTop: 'calc(100vh - 550px)',
      arrow: 'arrow6',
      arrowMargin: '30px 14px 0px 15px',
      arrowTransform: 'rotate(-120deg)',
      arrowPosition: 'left',
      viewAttached: 'sidebarRegion',
      documentClickOnNext: true,
      step: 5,
    },


    {
      description: 'These „chips“ indicate the currently selected parcellation map as well as selected region. Click the chip to see different versions, if any. Click (i) to read more about a selected item. Click (x) to clear a selection.',
      tooltipLeft: '18px',
      tooltipTop: 'calc(100vh - 340px)',
      arrow: 'arrow1',
      arrowTransform: 'scaleX(-1) rotate(170deg)',
      arrowMargin: '0 0 0 100px',
      arrowPosition: 'bottom',
      viewAttached: 'sidebarRegion',
      documentClickOnNext: true,
      step: 6,
    },
    {
      description: 'This is the coordinate navigator. Expand it to manipulate voxel and physical coordinates, to reset the view, or to create persistent links to the current view for sharing.',
      tooltipLeft: '50px',
      tooltipTop: '55px',
      arrowPosition: 'top',
      arrow: 'arrow1',
      autoNext: 'viewerStatusOpened',
      viewAttached: 'sidebar',
      step: 7,
    },

    {
      description: 'You can to manipulate voxel and physical coordinates, to reset the view, or to create persistent links to the current view for sharing.',
      tooltipLeft: '30px',
      tooltipTop: '130px',
      arrowPosition: 'top',
      arrow: 'arrow6',
      arrowMargin: '0 0 0 50%',
      viewAttached: 'sidebar',
      step: 7,
    },

    {
      description: 'Open sidebar to find the region quick search.',
      tooltipTop: '80px',
      arrow: 'arrow2',
      arrowMargin: '-40px 0 0 0',
      arrowTransform: 'scaleX(-1) rotate(180deg)',
      arrowPosition: 'arrow2',
      autoNext: 'sidebarOpened',
      step: 8,
    },

    {
      description: 'Use the region quick search for finding, selecting and navigating brain regions in the selected parcellation map.',
      tooltipTop: '65px',
      arrow: 'arrow6',
      arrowMargin: '-50px 10px 0 40px',
      arrowTransform: 'rotate(-55deg)',
      arrowPosition: 'left',
      documentClickOnNext: true,
      step: 8,
    },

    {
      description: 'These icons provide access to plugins, pinned datasets, and user documentation. Use the profile icon to login with your EBRAINS account.',
      tooltipRight: '125px',
      tooltipTop: '55px',
      arrowPosition: 'top',
      arrowMargin: '0 0 0 50%',
      arrowTransform: 'scaleX(-1)',
      arrow: 'arrow1',

      step: 9,
    },
  ]


  constructor() {
    this.numberOfSteps = new Array([...this.slides].filter(s => s.step).pop()['step'])
  }

  ngAfterViewInit() {
    const layerSelectorEl = document.querySelector('atlas-layer-selector')

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (this.slides[this.currentTip]?.autoNext === 'layerSelectorOpened' && mutation.target['dataset']['opened'] === 'true') {
          this.currentTip += 1
        } else if (this.slides[this.currentTip-1]?.autoNext === 'layerSelectorOpened' && mutation.target['dataset']['opened'] === 'false') {
          this.currentTip -= 1
        }
      })
    })

    const observerConfig = {
      attributes: true,
      childList: true,
      characterData: true
    }

    observer.observe(layerSelectorEl, observerConfig)

    this.observers.push(observer)
  }

  @HostListener('document:click', ['$event'])
  documentClick(event) {
    // Auto change view when nehuba navigation status is opened
    const nehubaStatus = document.querySelector('iav-cmp-viewer-nehuba-status')
    const nehubaStatusContainer = nehubaStatus? nehubaStatus.querySelector('mat-card.expandedContainer') : null
    if (this.slides[this.currentTip]?.autoNext === 'viewerStatusOpened' && nehubaStatusContainer) {
      this.currentTip += 1
    } else if(this.slides[this.currentTip-1]?.autoNext === 'viewerStatusOpened' && !nehubaStatusContainer) {
      this.currentTip -= 1
    }

    // Auto move to region search tip when sidebar is opened
    const drawerElement = document.getElementsByTagName('mat-drawer')[0] as HTMLElement
    const drawerOpened = drawerElement.getAttribute('data-mat-drawer-top-open') === 'true'
    if (this.slides[this.currentTip]?.autoNext === 'sidebarOpened' && drawerOpened) {
      const drawerWidth = drawerElement.offsetWidth
      this.currentTip += 1
      this.slides[this.currentTip].tooltipLeft = drawerWidth-100 + 'px'
    } else if(this.slides[this.currentTip-1]?.autoNext === 'sidebarOpened' && !drawerOpened) {
      this.currentTip -= 1
    }

    // Check sidebar status when on open/close
    const clickInsideCdkOverlay = document.querySelector('.cdk-overlay-container')?.contains(event.target)
    if (!clickInsideCdkOverlay) {
      this.checkSidebarStatus()
    }

  }


  goBack() {
    // Click document for closing menu
    if (this.slides[this.currentTip]?.documentClickOnNext) {
      document.body.click()
    }
    // Moeve to prev tip
    this.currentTip = this.slides.findIndex(s => s.step === this.slides[this.currentTip].step-1)

    //Checks
    //// Layer selector status
    this.checkAtlasLayerSelectorState()
    //// Sidebar status
    if (this.slides[this.currentTip]?.viewAttached === 'sidebar' || this.slides[this.currentTip]?.viewAttached === 'sidebarRegion') {
      this.checkSidebarStatus()
    }
  }

  goForward() {
    // Click document for closing menu
    if (this.slides[this.currentTip]?.documentClickOnNext) {
      document.body.click()
    }
    // Moeve to next tip
    this.currentTip = this.slides.findIndex(s => s.step === this.slides[this.currentTip].step+1)
    // Checks
    //// Layer selector status
    this.checkAtlasLayerSelectorState()
    //// Sidebar status
    if (this.slides[this.currentTip]?.viewAttached === 'sidebar' || this.slides[this.currentTip]?.viewAttached === 'sidebarRegion') {
      this.checkSidebarStatus()
    }
  }

  moveToTipByIndex(index) {
    // Click document for closing menu
    if (this.slides[this.currentTip]?.documentClickOnNext) {
      document.body.click()
    }
    // Moeve to next tip
    this.currentTip = this.slides.findIndex(s => s.step === index+1)
    // Checks
    //// Layer selector status
    this.checkAtlasLayerSelectorState()
    //// Sidebar status
    if (this.slides[this.currentTip]?.viewAttached === 'sidebar' || this.slides[this.currentTip]?.viewAttached === 'sidebarRegion') {
      this.checkSidebarStatus()
    }
  }


  checkAtlasLayerSelectorState() {
    const layerSelectorEl = document.querySelector('atlas-layer-selector')

    if (this.slides[this.currentTip]?.autoNext === 'layerSelectorOpened' && layerSelectorEl['dataset']['opened'] === 'true') {
      this.currentTip += 1
    }
  }

  private lastTipForSidebar = null
  private drawerOpened = false
  private drawerExpanded = false
  checkSidebarStatus() {
    const drawerElement = document.getElementsByTagName('mat-drawer')[0] as HTMLElement
    const expandDrawer = document.getElementsByTagName('mat-drawer')[1] as HTMLElement
    const drawerOpened = drawerElement.getAttribute('data-mat-drawer-top-open') === 'true'
    const drawerExpanded = expandDrawer.getAttribute('data-mat-drawer-fullleft-open') === 'true'

    const drawerWidth = drawerElement.offsetWidth

    if (this.slides[this.currentTip]?.viewAttached === 'sidebar' || this.slides[this.currentTip]?.viewAttached === 'sidebarRegion'
        && this.slides[this.currentTip].tooltipLeft) {

      if (this.slides[this.currentTip]?.viewAttached === 'sidebar') {
        if (drawerOpened
            && (!this.drawerOpened || this.lastTipForSidebar !== this.currentTip)
            && !this.slides[this.currentTip].movedForSidebar) {
          this.slides[this.currentTip].tooltipLeft = (parseInt(this.slides[this.currentTip].tooltipLeft) + drawerWidth) + 'px'
          this.slides[this.currentTip].movedForSidebar = true
        } else if (!drawerOpened
            && (this.drawerOpened || this.lastTipForSidebar !== this.currentTip)
            && this.slides[this.currentTip].movedForSidebar) {
          this.slides[this.currentTip].tooltipLeft = (parseInt(this.slides[this.currentTip].tooltipLeft) - drawerWidth) + 'px'
          this.slides[this.currentTip].movedForSidebar = false
        }
      } else if (this.slides[this.currentTip]?.viewAttached === 'sidebarRegion') {
        if (drawerExpanded
            && (!this.drawerExpanded || this.lastTipForSidebar !== this.currentTip)
            && !this.slides[this.currentTip].movedForSidebar) {
          this.slides[this.currentTip].tooltipLeft = (parseInt(this.slides[this.currentTip].tooltipLeft) + drawerWidth) + 'px'
          this.slides[this.currentTip].movedForSidebar = true
        } else if (!drawerExpanded
            && (this.drawerExpanded || this.lastTipForSidebar !== this.currentTip)
            && this.slides[this.currentTip].movedForSidebar) {
          this.slides[this.currentTip].tooltipLeft = (parseInt(this.slides[this.currentTip].tooltipLeft) - drawerWidth) + 'px'
          this.slides[this.currentTip].movedForSidebar = false
        }
      }
    }


    this.drawerOpened = drawerOpened
    this.drawerExpanded = drawerExpanded
    this.lastTipForSidebar = this.currentTip
  }

  ngOnDestroy(): void {
    this.observers.forEach(o => {
      o.disconnect()
    })
  }

}
