import * as L from 'neuroglancer/layout';
import {NavigationState, OrientationState, Pose} from 'neuroglancer/navigation_state';
import {PerspectivePanel} from 'neuroglancer/perspective_view/panel';
import {SliceView} from 'neuroglancer/sliceview/frontend';
import {SliceViewPanel} from 'neuroglancer/sliceview/panel';
import {TrackableBoolean} from 'neuroglancer/trackable_boolean';
import {RefCounted} from 'neuroglancer/util/disposable';
import {removeChildren} from 'neuroglancer/util/dom';
import {vec3, quat} from 'neuroglancer/util/geom';

import { SliceViewViewerState, ViewerUIState, getCommonViewerState } from 'neuroglancer/viewer_layouts.ts';
import { Viewer } from 'neuroglancer/viewer';
import { startRelativeMouseDrag } from 'neuroglancer/util/mouse_drag';

import { NehubaPerspectivePanel } from "nehuba/internal/nehuba_perspective_panel";
import { restrictUserNavigation } from "nehuba/internal/hooks";
import { Config } from "nehuba/config";

const sliceQuat = Symbol('SliceQuat');
/**
 * This function started as a copy of makeSliceView from https://github.com/google/neuroglancer/blob/9c78cd512a722f3fe9ed097155b6f64f48b8d1c9/src/neuroglancer/viewer_layouts.ts
 * Copied on 19.07.2017 (neuroglancer master commit 9c78cd512a722f3fe9ed097155b6f64f48b8d1c9) and renamed.
 * Latest commit to viewer_layouts.ts 736b20335d4349d8a252bd37e33d343cb73294de on May 21, 2017 "feat: Add Viewer-level prefetching support."
 * Any changes in upstream version since then must be manually applied here with care.
 */
function makeSliceViewNhb(viewerState: SliceViewViewerState, baseToSelf?: quat, customZoom?: number) {
  let navigationState: NavigationState;
  if (baseToSelf === undefined) {
    navigationState = viewerState.navigationState;
  } else {
    navigationState = new NavigationState(
        new Pose(
            viewerState.navigationState.pose.position,
            OrientationState.makeRelative(
                viewerState.navigationState.pose.orientation, baseToSelf)),
        customZoom || viewerState.navigationState.zoomFactor);
  }
  const slice =  new SliceView(viewerState.chunkManager, viewerState.layerManager, navigationState);
  (<any>slice)[sliceQuat] = baseToSelf || quat.create();
  return slice;
}

function makeFixedZoomSlicesFromSlices(sliceViews: SliceView[], viewerState: SliceViewViewerState, customZoom: number) {
  return sliceViews.map(slice => {
    const q: quat = (<any>slice)[sliceQuat];
    return makeSliceViewNhb(viewerState, q, customZoom);
  })
}

export const configSymbol = Symbol('config');

/**
 * In neuroglancer's FourPanelLayout all the work is done in constructor. So it is not feasible to extend or monkey-patch it. 
 * Therefore the fork of the whole FourPanelLayout class is needed to change it.
 * 
 * This class started as a copy of FourPanelLayout from https://github.com/google/neuroglancer/blob/9c78cd512a722f3fe9ed097155b6f64f48b8d1c9/src/neuroglancer/viewer_layouts.ts
 * Copied on 19.07.2017 (neuroglancer master commit 9c78cd512a722f3fe9ed097155b6f64f48b8d1c9) and renamed.
 * Latest commit to viewer_layouts.ts 736b20335d4349d8a252bd37e33d343cb73294de on May 21, 2017 "feat: Add Viewer-level prefetching support."
 * Any changes in upstream version since then must be manually applied here with care.
 */
export class NehubaLayout extends RefCounted {
  constructor(public rootElement: HTMLElement, public viewer: ViewerUIState) {
    super();

    const config: Config = (viewer.display.container as any)[configSymbol];
    if (!config) throw new Error('Are you trying to use nehuba classes directly? Use should use defined API instead');
    const layoutConfig = config.layout || {};

    layoutConfig.useNehubaPerspective && !layoutConfig.useNehubaPerspective.doNotRestrictUserNavigation && restrictUserNavigation(viewer as Viewer);

    const bg = layoutConfig.planarSlicesBackground || (config.dataset && config.dataset.imageBackground);
    const changeBackground = (slice: SliceViewPanel) => {
      bg && (slice['backgroundColor'] = bg);
      return slice;
    }
    const configureSliceViewPanel = (slice: SliceViewPanel) => {
      disableFixedPointInZoom(disableFixedPointInRotation(changeBackground(slice), config), config);
      return slice;
    }

    if (!layoutConfig.views) {
      layoutConfig.views = 'hbp-neuro'; // TODO should use neuroglaner quats by default
      // = { //Default neuroglancer quats
      //   slice1: quat.create(),
      //   slice2: quat.rotateX(quat.create(), quat.create(), Math.PI / 2),
      //   slice3: quat.rotateY(quat.create(), quat.create(), Math.PI / 2)
      // }
    }
    if (layoutConfig.views === 'hbp-neuro') {
      layoutConfig.views = {
        slice1: quat.rotateX(quat.create(), quat.create(), -Math.PI / 2),
        slice2: quat.rotateY(quat.create(), quat.rotateX(quat.create(), quat.create(), -Math.PI / 2), -Math.PI / 2),
        slice3: quat.rotateX(quat.create(), quat.create(), Math.PI)
      }
    }
    const views = layoutConfig.views;
    const quats = [views.slice1, views.slice2, views.slice3];
	 let sliceViews = quats.map(q => { return makeSliceViewNhb(viewer, q); });

    const makePerspective: L.Handler = element => {
      element.className = 'gllayoutcell noselect';

      if (layoutConfig.useNehubaPerspective) {
        const conf = layoutConfig.useNehubaPerspective;
        let perspectivePanel = this.registerDisposer(
            new NehubaPerspectivePanel(display, element, perspectiveViewerState, config));
        
        sliceViews.forEach(slice => { perspectivePanel.planarSlices.add(slice.addRef()); })
        if (conf.fixedZoomPerspectiveSlices) {
          const cnfg = conf.fixedZoomPerspectiveSlices;
          makeFixedZoomSlicesFromSlices(sliceViews, viewer, cnfg.sliceZoom).forEach(slice => {
            const m = cnfg.sliceViewportSizeMultiplier;
            slice.setViewportSize(cnfg.sliceViewportWidth * m, cnfg.sliceViewportHeight * m);
            perspectivePanel.sliceViews.add(slice);
          })
        } else {
          for (let sliceView of sliceViews) {
            perspectivePanel.sliceViews.add(sliceView.addRef());
          }
        }
      } else {
        let perspectivePanel = this.registerDisposer(
            new PerspectivePanel(display, element, perspectiveViewerState));
        for (let sliceView of sliceViews) {
          perspectivePanel.sliceViews.add(sliceView.addRef());
        }              
      }
    };
	 
    let {display} = viewer;

    const perspectiveViewerState = {
      ...getCommonViewerState(viewer),
      navigationState: viewer.perspectiveNavigationState,
      showSliceViews: viewer.showPerspectiveSliceViews,
      showSliceViewsCheckbox: !layoutConfig.hideSliceViewsCheckbox,
      slicesNavigationState: viewer.navigationState //!!! Passed down to NehubaPerspectivePanel in the 'untyped' way. Was already deleted once by mistake. Be careful.
    };

    const sliceViewerState = {
      ...getCommonViewerState(viewer),
      navigationState: viewer.navigationState,
      showScaleBar: viewer.showScaleBar,
    };

    const sliceViewerStateWithoutScaleBar = {
      ...getCommonViewerState(viewer),
      navigationState: viewer.navigationState,
      showScaleBar: new TrackableBoolean(false, false),
    };
    let mainDisplayContents = [
      L.withFlex(1, L.box('column', [
        L.withFlex(1, L.box('row', [
          L.withFlex(1, element => {
            element.className = 'gllayoutcell noselect';
            this.registerDisposer(configureSliceViewPanel(new SliceViewPanel(display, element, sliceViews[0], sliceViewerState)));
          }),
          L.withFlex(1, element => {
            element.className = 'gllayoutcell noselect';
            this.registerDisposer(configureSliceViewPanel(new SliceViewPanel(display, element, sliceViews[1], sliceViewerStateWithoutScaleBar)));
          })
        ])),
        L.withFlex(1, L.box('row', [
          L.withFlex(1, element => {
            element.className = 'gllayoutcell noselect';
            this.registerDisposer(configureSliceViewPanel(new SliceViewPanel(display, element, sliceViews[2], sliceViewerStateWithoutScaleBar)));
			 }),
			 L.withFlex(1, makePerspective)
        ])),
      ]))
    ];
    L.box('row', mainDisplayContents)(rootElement);
    display.onResize();
  }

  disposed() {
    removeChildren(this.rootElement);
    super.disposed();
  }
}

// ****** !!! Needs attention !!! ******  Even so the change is minimal - the code is forked/copy-pasted from NG and needs to be updated if changed upstream.
// The startDragViewport function is copied from https://github.com/google/neuroglancer/blob/9c78cd512a722f3fe9ed097155b6f64f48b8d1c9/src/neuroglancer/sliceview/panel.ts
// Copied on 19.07.2017 (neuroglancer master commit 9c78cd512a722f3fe9ed097155b6f64f48b8d1c9).
// Latest commit to panel.ts 3d08828cc337dce1e9bba454f0ef00073697b2e0 on Jun 6, 2017 " fix: make SliceViewPanel and PerspectivePanel resize handling more ro…"
// Any changes in upstream version since then must be manually applied here with care.
function disableFixedPointInRotation(slice: SliceViewPanel, config: Config) {
	slice.startDragViewport = function (this: SliceViewPanel, e: MouseEvent) {
    let {mouseState} = this.viewer;
    if (mouseState.updateUnconditionally()) {
		//⇊⇊⇊ Our change is only here ⇊⇊⇊
      let initialPosition = config.rotateAtViewCentre ? undefined : vec3.clone(mouseState.position);
		//⇈⇈⇈ Our change is only here ⇈⇈⇈

      startRelativeMouseDrag(e, (event, deltaX, deltaY) => {
        let {position} = this.viewer.navigationState;
        if (event.shiftKey) {
          let {viewportAxes} = this.sliceView;
          this.viewer.navigationState.pose.rotateAbsolute(
              viewportAxes[1], deltaX / 4.0 * Math.PI / 180.0, initialPosition);
          this.viewer.navigationState.pose.rotateAbsolute(
              viewportAxes[0], deltaY / 4.0 * Math.PI / 180.0, initialPosition);
        } else {
          let pos = position.spatialCoordinates;
          vec3.set(pos, deltaX, deltaY, 0);
          vec3.transformMat4(pos, pos, this.sliceView.viewportToData);
          position.changed.dispatch();
        }
        // 'restrictUserNavigation' is implemented in hooks.ts
        // But maybe we can stop the mouse from moving beyond the boundaries if we implement it here?
      });
    }
	};

  return slice;
}

function disableFixedPointInZoom(slice: SliceViewPanel, config: Config) {
  const originalZoomByMouse = slice.zoomByMouse;
  slice.zoomByMouse = function (this: SliceViewPanel, factor: number) {
    if (config.zoomAtViewCentre) this.navigationState.zoomBy(factor);
    else originalZoomByMouse.call(this, factor);
  }

  return slice;
}  

/*
function patchSliceView(slice: SliceViewPanel) {
  let untyped = slice as any;
  untyped.unregisterDisposer(untyped.sliceViewRenderHelper);
  untyped.registerDisposer(untyped.sliceViewRenderHelper = NehubaSliceViewRenderHelper.get(untyped.gl, sliceViewPanelEmitColor))
  return slice;
}
*/