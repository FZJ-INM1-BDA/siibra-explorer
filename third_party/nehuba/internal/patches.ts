import { LAYOUTS } from 'neuroglancer/viewer_layouts';
import { RenderedDataPanel } from "neuroglancer/rendered_data_panel";
import { ImageUserLayer } from "neuroglancer/image_user_layer";
import { SegmentationUserLayer } from "neuroglancer/segmentation_user_layer";
import { MeshSource } from 'neuroglancer/mesh/frontend';
import { SingleMeshUserLayer } from "neuroglancer/single_mesh_user_layer";
import { RenderLayer } from "neuroglancer/layer";
import { SingleMeshLayer } from "neuroglancer/single_mesh/frontend";
import { Viewer, ViewerOptions } from "neuroglancer/viewer";

import { Config } from "nehuba/config";
import { NehubaLayout } from "nehuba/internal/nehuba_layout";
import { NehubaMeshLayer } from "nehuba/internal/nehuba_mesh_layer";
import { patchSingleMeshLayer } from "nehuba/internal/nehuba_single_mesh_layer";

let patched = false;
/** Monkey patch neuroglancer code. Can be done only once. Can not be undone. Should be done before any Viewer instances are created and affects all of them. */
export function patchNeuroglancer(config: Config) {
	const conf = config.globals || {};
	//TODO allow patching multiple times with the same config
	//TODO check for config values in patches. Allows runtime toggling. But only if was on here... Or should we patch all then anyway? Not good for debug/tracing problems
	if (patched) return; //throw new Error('Monkey patches are already applied to Neuroglancer. Should call patchNeuroglancer(config) only once');
	/** Install JulichLayout as the only layout used by neuroglancer */
	if (conf.useNehubaLayout) {
		if (typeof conf.useNehubaLayout === 'object') {
			if (conf.useNehubaLayout.keepDefaultLayouts) LAYOUTS.push(LAYOUTS[0]); //Re-add original 4panel layout to the end
			else LAYOUTS.length = 0; //Disables other layouts until further notice. (They need to be updated too.)
		} else if (typeof conf.useNehubaLayout === 'boolean') LAYOUTS.length = 0; //Disables other layouts until further notice. (They need to be updated too.)
		LAYOUTS[0] = ['Nehuba', (element, viewer) => new NehubaLayout(element, viewer)];
	}
	if (conf.hideNullImageValues) fix_HideNullImageValues();
	if (conf.useNehubaMeshLayer) useNehubaMeshInSegmentationLayer();
	if (conf.useNehubaSingleMeshLayer) useNehubaSingleMesh();
	if (conf.embedded) hideNeuroglancerUI();
	
	// ***************** Deprecated *****************
	if (conf.zoomWithoutCtrlGlobal) flipMouseWheelCtrl();
	//Custom action on right click is implemented in useCtrlForNgRightClick too, but not exposed yet via config. Rename useCtrlForNgRightClick once it is
	if (conf.rightClickWithCtrlGlobal) useCtrlForNgRightClick();

	patched = true;
}

export function useNehubaSingleMesh() {
/*	The other (correct) way to do it would be to implement our own user layer and register it. Something like:
	class NehubaSingleMeshUserLayer extends SingleMeshUserLayer {
		constructor(manager: LayerListSpecification, x: any) {
			super(manager,x);
			...............
		}
		addRenderLayer(layer: RenderLayer) {
			...............
			super.addRenderLayer(layer);
		}
	}
	registerLayerType('nmesh', NehubaSingleMeshUserLayer);
*/
	const originalAddRenderLayer = SingleMeshUserLayer.prototype.addRenderLayer;
	SingleMeshUserLayer.prototype.addRenderLayer = function (this:SingleMeshUserLayer, layer: RenderLayer) {
		//At this point SingleMeshLayer just created by SingleMeshUserLayer constructor
		//Currently this method is called only by SingleMeshUserLayer and only with `new SingleMeshLayer(...)`
		//So we know that layer is SingleMeshLayer, but still perform instanceof check just in case
		if (layer instanceof SingleMeshLayer) patchSingleMeshLayer(layer as SingleMeshLayer);
		originalAddRenderLayer.call(this, layer);
	}
}


//@ZeroMaintenance. Wraps original NG function, so no care needed when updating NG.
function fix_HideNullImageValues() {
	//TODO submit pull-request upstream to not show 'null' in layer panel to remove this patch
	const originalImageTransform = ImageUserLayer.prototype.transformPickedValue;
	ImageUserLayer.prototype.transformPickedValue = function (this: ImageUserLayer, value: any) {
		let transformed = originalImageTransform.call(this, value);
		if (transformed === null) transformed = undefined;
		return transformed;
	}
}


//@MinimalMaintenance. Because method is so small and the change is so simple. But needs to be monitored upstream for changes.
function useNehubaMeshInSegmentationLayer() {
	SegmentationUserLayer.prototype.addMesh = function (this: SegmentationUserLayer, meshSource: MeshSource) {
		// this.meshLayer = new MeshLayer(this.manager.chunkManager, meshSource, this.displayState);
		this.meshLayer = new NehubaMeshLayer(this.manager.chunkManager, meshSource, this.displayState) as any;
		this.addRenderLayer(this.meshLayer!);
	};	
}

/** This is temporary solution, not very much needed. Will be deprecated and removed. TO BE DEPRECATED  */
function hideNeuroglancerUI() {
	const originalMakeUI = Viewer.prototype['makeUI'];
	Viewer.prototype['makeUI'] = function(this: Viewer) {
		const opts: ViewerOptions = this['options'];
		opts.showHelpButton = false;
		opts.showLayerDialog = false;
		opts.showLayerPanel = false;
		opts.showLocation = false;
		originalMakeUI.call(this);
	}
}

// ***************** Deprecated *****************

//@Deprecated. There is instance-specific implementation which captures wheel event on the top viewer element and re-dispatch the proxied one
// This code left just for the reference and as a fallback if new instance implementation disbehaves 
//@ZeroMaintenance. Wraps original NG function, so no care needed when updating NG.
function flipMouseWheelCtrl() {
	//TODO Capture mouse wheel event on the top viewer element and re-dispatch the proxied one
	//This way we avoid monkey patching AND avoid it to be global config option
	const ngOnMouseWheel = RenderedDataPanel.prototype.onMousewheel;
	RenderedDataPanel.prototype.onMousewheel = function(this: RenderedDataPanel, e: WheelEvent) {
		const evt = new Proxy<WheelEvent>(e, {
			get: function(target: any, p: PropertyKey) {
				if (p === 'ctrlKey') return !target[p];
				const res = target[p];
				if (typeof res === 'function') return res.bind(target);
				else return res;
			}
		});
		evt.stopImmediatePropagation();
		evt.stopPropagation();
		const evt2 = new WheelEvent(e.type, evt);
		ngOnMouseWheel.call(this, evt2);
	}
}

//@Deprecated. There is instance-specific implementation which stops right button click propogation on the top viewer element if ctrl is not pressed
// Here is an example of how to handle right click better
// This code left just for the reference and as a fallback if new instance-specific implementation behaves incorrectly
//@MinimalMaintenance. Wraps original NG function, so no care needed when updating NG, unless user controls logic changes significantly upstream
function useCtrlForNgRightClick() {
	//TODO May be capture event on the top viewer element similar to flipMouseWheelCtrl? To make it not global and avoid monkey patching?
	//TODO Should be anyway somehow configurable along with all the other mouse/keyboard controls on the higher level

	//Copied and modified from atlas_viewer_setup
	//Patching RenderedDataPanel affects both SliceViewPanel and PerspectivePanel. TODO May be patch only slice view, or both with different actions...
	const ngOnMouseDown = RenderedDataPanel.prototype.onMousedown;
	RenderedDataPanel.prototype.onMousedown = function (this: RenderedDataPanel, e: MouseEvent) {
		if (e.button === 2) {
			//TODO Distinguish click from drag?
			//TODO Distinguish clicks in the image from click on panel background outside of image...?
			//TODO e.preventDefault()?
			if (e.ctrlKey) {
				e.view.addEventListener('mouseup', (e) => {
					if (e.target === this.element && e.button === 2 && e.ctrlKey/*? do we really need ctrl to be pressed on mouseup?*/) { //check for right button? On my mouse I can not press left and right at the same time, but somebody might produce such a combo (right down -> left down -> left up), right?
						ngOnMouseDown.call(this, e);
					}
				}, { once: true } as any); // TODO 'once' is new (hance "as any", no typings yet), Firefox 50+, Chrome 55+, Safari ?. TODO Reimplement with once function like here https://hastebin.com/ikixonajuk.coffee for compatibility
			} else {
				e.view.addEventListener('mouseup', (e) => {
					if (e.target === this.element && e.button === 2) { //check for right button? On my mouse I can not press left and right at the same time, but somebody might produce such a combo (right down -> left down -> left up), right?
						// this.viewer.layerManager.invokeAction('custom');
						//TODO ___________ Context menu ____________ Here or in customActionHandler?
					}
				}, {once: true} as any); // TODO 'once' is new (hance as any, no typings yet), Firefox 50+, Chrome 55+, Safari ?. TODO Reimplement with once function like here https://hastebin.com/ikixonajuk.coffee for compatibility
			}
		} else ngOnMouseDown.call(this, e);
	};	
}