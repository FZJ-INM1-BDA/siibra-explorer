import { vec4, quat } from 'nehuba/exports';
//TODO Get rid of vec4 and other imports. Config as a public API should neither depend on any third-party libraries (gl-matrix), nor expose neuroglancer types without strong reason
//TODO Need a clear way to represent colors and quats without using vec4 and quat
//TODO At least change vec4 to vec3 for colors....

export type removeBackgroundMode = 'none' | '>' | '>=' | '==' | '<='| '<';

//TODO Check for required global settings when creating viewers?
/** Plain old json to be easily stored elsewhere. Everything is optional. The idea is that with no config or an empty `{}` object, 
 *  Nehuba viewer should behave just like default vanilla neuroglancer. (At least it is a design goal and any deviation in 
 *  behavior should be considered as a bug and fixed. Currently there are few documented exceptions.) 
 *  Whenever possible, Nehuba will check the values in the config at runtime so that any changes (toggling options) made in the config
 *  after the viewer was created with it will still be reflected. */
export interface Config {
	configName?: string //TODO Remove? There is currently no use for it.
	// These global settings are mainly for development, so that it is possible to switch between Nehuba custom classes and original upstream Neuroglancer. 
	// Maybe later they should be all on by default and/or hidden in dev config
	// Could be a separate globalConfig and global configure() method.
	/** Affects all instances of the viewer on the page. Options in this section are not togglable.
	 *  Currently this global optioans are checked and patches are applied when the first instance or the viewer is created.
	 *  For subsequent instances this section is ignored. Be warned. */
	globals?: { //TODO How to treat for second instance? Check values/ignore/error? //TODO Get rid of globals section
		/** Don't display 'null' in layer panel value field for images. TODO Submit PR upstream? */
		hideNullImageValues?: boolean

		/** Install Nehuba layout and remove Neuroglancer layouts. Nehuba layout is configured by 'layout' section of this config. */
		useNehubaLayout?: boolean | { //TODO Find a way to patch Viewer to use our custom LAYOUTS array so that all the layouts are completely instance configurable 
			keepDefaultLayouts?: false //Fixed to false, because currently they are broken by our patches, but should be boolean eventually... probably... Or just removed.
		}
		/** Patch Neuroglancer to use NehubaMeshLayer instead of original MeshLayer.
		 *  NehubaMeshLayer provides the capability to remove the front (or any other) octant of the mesh. 
		 *  By default it should behave exactly like Neuroglancer MeshLayer. Usage of additional capabilities is controlled by 
		 *  'layout.useNehubaPerspective.mesh' section of this config.*/
		useNehubaMeshLayer?: boolean //Could be on by default and removed from config since NehubaMeshLayer without further connfiguration should behave like upstream MeshLayer
		/** Patch Neuroglancer SingleMeshLayer to provide the capability to remove the front (or any other) octant of the mesh.
		 *  By default it should behave exactly like not patched neuroglancer SingleMeshLayer. Usage of additional capabilities is controlled by 
		 *  'layout.useNehubaPerspective.mesh' section of this config.*/
		useNehubaSingleMeshLayer?: boolean //Could be on by default and removed from config since patched SingleMeshLayer without further connfiguration should behave like upstream SingleMeshLayer

		/** Remove top neuroglancer UI. This is quick and dirty solution by monkey-patching neuroglancer viewer, hence global. TODO find more elegant approach
		 *  This is temporary solution, not very much needed. Will be deprecated and removed. TO BE DEPRECATED */
		embedded?: boolean
		/*********************** Deprecated ***********************/
		//@Deprecated Use instance-specific rightClickWithCtrl instead. This one could be used as a fallback if instance-specific implementation behaves incorrectly
		rightClickWithCtrlGlobal?: boolean
		//@Deprecated Use instance-specific zoomWithoutCtrl instead. This one could be used as a fallback if instance-specific implementation behaves incorrectly
		zoomWithoutCtrlGlobal?: boolean 
	}
	/** Intercept mouse wheel events on the parent DOM element of the viewer, flip the ctrl flag and propogate further.
	 *  Effectively tricking neuroglancer to think that ctrl button is pressed when it is not and vice versa. Togglable. */
	zoomWithoutCtrl?: boolean
	/** Currently just stops propagation of right mouse click event if ctrl button is not pressed. Togglable. */
	rightClickWithCtrl?: boolean
	/** From Neuroglancer docs: 
	 *  "Shift-left-drag within a slice view to change the orientation of the slice views. The projection of the point where the drag started will remain fixed." 
	 *  This flag disables 'fixed projection of the point' part. It is implemented by NehubaLayout, so will not work without it. Togglable. */
	disableFixedPointObliqueRotation?: boolean //TODO Since it depends on NehubaLayout, would be reasonable to move to layout section.
	/** Restricts user movements to the boundaries of displayed volumes, i.e
	 *  prevents the user to navigate away from the data, which does not make sense anyway.
	 *  Required for clipped mesh "3d view" in NehubaPerspective, otherwise it looks ugly and broken if the user does navigate far away from the slice field of view.
	 *  Therefore, this restriction is enforced by NehubaPerspective if it is used, regardless of this setting. This setting is provided to restrict
	 *  user navigation in case NehubaPerspective is not used.
	 *  Currently there is no way to 'undo' this restriction for the provided Viewer instance. Thus not togglable. (This could be changed if needed)*/
	restrictUserNavigation?: boolean
	/** Disables 'selection' when mouse hovers over a segment. Currently is only used by BigBrain preview, because with 2 large segments this selection 
	 *  is just annoying flickering.	Not togglable.*/
	disableSegmentSelection?: boolean

	/** Neuroglancer state plus additional metadata neseccary to properly display the dataset. 
	 *  Eventually might be stored in Knowledge Graph next to the actual data.	*/
	dataset?: {
		/** Background of images. For example in most cases it would be black for MRI images (background means absence of signal hence minimum intensity)
		 *  or white for scanned bigbrain images (background is maximum intensity of light). Used everywhere as a background for slice views instead of
		 *  default neuroglancer grey and most importanyly in the removePerspectiveSlicesBackground procedure, which is quite vital for a so-called "3d view".
		 *  On every occasion the option is provided to override this parameter if needed. Togglable if it matters. */
		imageBackground: vec4 //TODO make optional
		/** Initial neuroglancer state json (encoded in url). Used when creating a viewer. Changing this property after that will have no effect. So not togglable.
		 *  Use API call [TODO] to set the state after creation. */
		initialNgState?: any //Untyped as in Neuroglancer, but TODO should make an interface describing it.
	}

	/** Configure NehubaLayout (and NehubaPerspective). Used only if 'globals.useNehubaLayout' is on, otherwise original Nuroglancer layouts are used, which, obviously, are unaware of this config. */
	layout?: {
		/** Configure planar slice views.
		 *  Currently, if not set, it defaults to 'hbp-neuro' for convenience. This will be changed in the future for consistency to default to Neuroglancer default set of views.
		 *  'hbp-neuro' is a shortcut to the set of predefined views used in HBP human brain atlas following neurological convention.
		 *  When layout is created and this setting was empty or set to the string shortcut like 'hbp-neuro', it will be substituted by Nehuba to the set of actual quaternions used to create views.
		 *  So that you can access and change them easily afterwards, for example to mirror the views across the X axis in order to change between neurological and radiological conventions.
		 *  Therefore togglable, but needs relayout for changes to take effect. */
		views?: 'hbp-neuro' | {
			slice1: quat;
			slice2: quat;
			slice3: quat;
			// mainSlice?: 1 | 2 | 3 // experimental alpha feature in "mainslice" branch
		}		
		/** Override background of planar slive views. If not set, then 'dataset.imageBackground' will be used instead. Togglable, but needs relayout to be changed.*/
		planarSlicesBackground?: vec4
		/** Hide neuroglancer 'Slices' checkbox in perspective view. It is undesirable to let the user remove images when front octant is removed from the mesh.
		 *  Togglable, but needs relayout to be changed. */
		hideSliceViewsCheckbox?: boolean
		/** Use NehubaPerspective instead of neuroglancer Perspective. Provides the ability to remove the front (or any other) octant of the mesh
		 *  (if 'globals.useNehubaMeshLayer' or 'globals.useNehubaSingleMeshLayer' is on) and other customisations.
		 *  By default shift-drag is disabled,    that should be changed because the default behavior should be the same as upstream NG //TODO
		 *  By default restricts user navigation, that should be changed because the default behavior should be the same as upstream NG //TODO 
		 *  Togglable, but needs relayout to be changed. */
		useNehubaPerspective?: {
			/** There is something wrong with shift-drag of perspective view if 'centerToOrigin' is true. So it is disabled by default. TODO Reenable and fix.
			 *  Better leave it off. It is still here for developer use. Will be fixed and removed. */
			enableShiftDrag?: boolean
			/** Do not enforce restriction of user navigation. See doc of 'restrictUserNavigation' for details.
			 *  Better leave it off, otherwise clipped mesh will look broken. It is still here for developer use */
			doNotRestrictUserNavigation?: boolean
			/** Override background of slices in the perspective view if needed. Normally makes sense to leave it out, 
			 *  so that 'dataset.imageBackground' will be used and removed by 'removePerspectiveSlicesBackground'. It is here just for
			 *  completeness and some developer use. 
			 *  If not set, then 'planarSlicesBackground' (or if not set then 'dataset.imageBackground') is used instead. Otherwise default is grey. 
			 *  Togglable (needs redraw). */
			perspectiveSlicesBackground?: vec4 //TODO Does it make sense to use planarSlicesBackground if not set? Or fallback directly to dataset.imageBackground?
			/** Discard pixels in perspective slices with color greater, less or equal to background. Neseccary for a "3d view". Togglable (needs redraw).*/
			removePerspectiveSlicesBackground?: { //TODO add "| boolean" to the type to have a shortcut 'removePerspectiveSlicesBackground: true'
				/** Override background color used for removal if needed. Normally makes sense to leave it out, so that 'dataset.imageBackground' will be used.
				 *  If not set, then 'perspectiveSlicesBackground' (or, consequantly, 'planarSlicesBackground' or 'dataset.imageBackground') is used instead. 
				 *  Otherwise default is grey. Togglable (needs redraw). */
				color?: vec4
				/** Specifies the mode of background removal (discrad pixels with color equal to background or greater then background etc.)
				 *  Default is 'none', so no background is removed if mode is not set.
				 *  Affects shader code, so checked once at construction time and currently can not be changed after that. 
				 *  (It is possible to make it togglable at runtime, but will need the change of shader, which is OK, but would require a separate API call 
				 *  since we don't want to compile a new shader at each draw() request...) */
				mode?: removeBackgroundMode
			}
			/** Custom perspective background. 
			 *  If not set, then 'perspectiveSlicesBackground' (or if not set 'planarSlicesBackground' / 'dataset.imageBackground') will be used instead. 
			 *  Otherwise defaults is grey. Togglable (needs redraw). */
			perspectiveBackground?: vec4
			/** Fix zoom level in perspective view slices(independent zooming). Neseccary to achieve a "3d view" with clipped mesh. Togglable, but needs relayout to be changed. */
			fixedZoomPerspectiveSlices?: {
				// Originally in neuroglancer slices in perspective view are just the same slices as in planar views. So their viewport 
				// size is determined by layout from window size. To fix zoom level we make a new set of independent slices for perspective
				// view, so it make sense to use custom viewport size which will fit better (by being rectangular for example).
				//TODO Find a way to calculate appropriate viewport size based on zoom level instead of demanding them from the user
				/** Custom viewport width for fixed zoom perspective slices. Should be big enough to accomodate the entire brain at the 'sliceZoom' 
				 *  zoom level to get a "3d view".
				 *  Also determines the size of substrate planes when they are used. Togglable, but needs relayout to be changed.*/
				sliceViewportWidth: number //TODO make optional
				/** Custom viewport height for fixed zoom perspective slices. Should be big enough to accomodate the entire brain at the 'sliceZoom' 
				 *  zoom level to get a "3d view".
				 *  Also determines the size of substrate planes when they are used. Togglable, but needs relayout to be changed.*/
				sliceViewportHeight: number //TODO make optional
				/** Zoom level to fix perspective slices to. Should be big/small ebough to accomodate the entire brain to get a "3d view".
				 *  Just copy "perspectiveZoom" value from your initial neuroglancer json state to begin with. 
				 *  //TODO make it optional and take the value from "perspectiveZoom" of initial json state. Togglable, but needs relayout to be changed.*/
				sliceZoom: number
				/** Some internal implementation detail left exposed for developer use.
				 *  Set it to 1 if you just want to use fixed zoom slices in the perspective view without clipped mesh or "3d view".
				 *  Or set to >=2 if you use clipped mesh and removePerspectiveSlicesBackground, otherwise it will look broken. */
				sliceViewportSizeMultiplier: 1 | 2 | 3
			}
			/** Configure mesh. Currently only provides a possibility to remove front octant to get a clipped mesh to achieve a "3d view". Togglable (needs redraw).*/
			mesh?: { //TODO Maybe rename it to clippedMesh or something and add "boolean |" shortcut
				/** Remove one particular octant. The octant to be removed is represented as vec4, where xyz could be either +1 or -1. The eight
				 *  combinations of + and - encode eight available octants. For example the "front" octant in the default HBP view states is [-1.0, 1.0, 1.0]. 
				 *  If 'flipRemovedOctant' is on, then this parameter is ignored and removed octant is flipped to be always the front one.
				 *  Otherwise no octant is removed if this parameter is absent. Togglable (needs redraw).*/
				removeOctant?: vec4
				/** When one octant of the mesh is removed, the inside of the mesh becomes visible "through the hole" which is not desirable.
				 *  Instead of closing the mesh with the use of stencil buffers and such, the inside of the mesh is just painted with the 
				 *  background color of slices. This way the back of the mesh also provides color to the inside parts of the brain image where pixels were 
				 *  discarded by 'removePerspectiveSlicesBackground' procedure. So generally it is better to leave this parameter of, but it is
				 *  here if you need to override the color used for inside of the mesh for any reason.
				 *  If not set, then 'perspectiveSlicesBackground' or 'planarSlicesBackground' or 'dataset.imageBackground' will be used instead. Togglable (needs redraw).*/
				backFaceColor?: vec4
				/** Clip part of the mesh based on intersection of slice views. Should be true, otherwise "3d view" will look broken. Togglable (needs redraw).*/
				removeBasedOnNavigation?: boolean
				/** Always change removed octant to the front octant when the user changes orientation of the perspective or the orientation of the slice views. Togglable (needs redraw).*/
				flipRemovedOctant?: boolean
			}
			/** Center perspective view at the center of the brain instead of intersection point of slice views. Togglable (needs redraw).*/
			centerToOrigin?: boolean
			/** Draw transparent substrate planes under the slices in the perspective view. Togglable (needs redraw).*/
			drawSubstrates?: {
				/** Default is vec4.fromValues(0.0, 0.0, 1.0, 0.2) if not specified. Togglable (needs redraw). */
				color?: vec4,
			}
			/** Draw transparent planes on top of slices in the perspective view to indicate zoom level of planar views. Togglable (needs redraw).*/
			drawZoomLevels?: {
				/** Don't draw zoom boxes if zoom value is less then cutOff. Togglable (needs redraw).*/
				cutOff?: number
				/** Default is vec4.fromValues(1.0, 0.0, 0.0, 0.2) if not specified. Togglable (needs redraw). */
				color?: vec4
			}
			/** Don't draw slices in the perspective view. This setting make no sense and should be removed. Provided only for the sake of completeness. Togglable (needs redraw).*/
			hideImages?: boolean //TODO move to dev or remove
			/** For whatever reason, it takes quite some time in neuroglancer for the mesh to show up. This should be investigated and fixed,
			 *  but until then here is an option to block the display of perspective view until the mesh is ready. Otherwise the user will see just
			 *  perpendicular slices, which looks not nice and should be hidden from the user. Togglable (needs redraw).*/
			waitForMesh?: boolean
			/** Restrict zooming of perspective view, for example to prevent the user to zoom in too close to see pixelated low-res images. Togglable.*/
			restrictZoomLevel?: {
				minZoom?: number
				maxZoom?: number
			}
		}
	}
}