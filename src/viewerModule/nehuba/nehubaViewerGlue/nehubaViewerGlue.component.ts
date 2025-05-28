import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output } from "@angular/core";
import { IViewer, TViewerEvent } from "../../viewer.interface";
import { NehubaMeshService } from "../mesh.service";
import { NehubaLayerControlService, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";
import { EXTERNAL_LAYER_CONTROL, NG_LAYER_CONTROL, SET_SEGMENT_VISIBILITY } from "../layerCtrl.service/layerCtrl.util";
import { NehubaConfig } from "../config.service";
import { SET_MESHES_TO_LOAD } from "../constants";


@Component({
  selector: 'iav-cmp-viewer-nehuba-glue',
  templateUrl: './nehubaViewerGlue.template.html',
  styleUrls: [
    './nehubaViewerGlue.style.css'
  ],
  exportAs: 'iavCmpViewerNehubaGlue',
  providers: [
    {
      provide: SET_MESHES_TO_LOAD,
      useFactory: (meshService: NehubaMeshService) => meshService.loadMeshes$,
      deps: [ NehubaMeshService ]
    },
    {
      provide: EXTERNAL_LAYER_CONTROL,
      useValue: NehubaLayerControlService
    },
    NehubaMeshService,
    {
      provide: SET_COLORMAP_OBS,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.setColorMap$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: SET_LAYER_VISIBILITY,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.visibleLayer$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: SET_SEGMENT_VISIBILITY,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.segmentVis$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: NG_LAYER_CONTROL,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.registerNgCtrl.bind(layerCtrl),
      deps: [ NehubaLayerControlService ]
    },
    NehubaLayerControlService,
    NehubaMeshService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NehubaGlueCmp implements IViewer<'nehuba'>, OnDestroy {

  private onDestroyCb: (() => void)[] = []

  public nehubaConfig: NehubaConfig
  public QUICKTOUR_DND_MD = `Drag and drop a \`[.label].nii[.gz]\` file on the viewer to visualize the volume.`

  ngOnDestroy(): void {
    while (this.onDestroyCb.length) this.onDestroyCb.pop()()
  }

  @Output()
  public viewerEvent = new EventEmitter<TViewerEvent<'nehuba'>>()

  constructor(){
    this.onResize()
  }
  
  public quickTourOverwritingPos = {
    'dialog': {
      left: '0px',
      top: '0px',
    },
    'arrow': {
      left: '0px',
      top: '0px',
    }
  }
  public onResize(){
    
    const { innerWidth, innerHeight } = window
    this.quickTourOverwritingPos = {
      'dialog': {
        left: `${innerWidth * 0.55}px`,
        top: `${innerHeight * 0.55}px`,
      },
      'arrow': {
        left: `${innerWidth * 0.55 - 48}px`,
        top: `${innerHeight * 0.55 - 48}px`,
      }
    }
  }
}
