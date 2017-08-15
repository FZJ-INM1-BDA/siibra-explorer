import { vec4 } from 'neuroglancer/util/geom'
import { Config } from 'nehuba/exports'
import { BigBrainState, JuBrainWithMesh } from './datasetUrlstate'

const WHITE = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
const BLACK = vec4.fromValues(0.0, 0.0, 0.0, 0.0);

export const BigBrain: Config = {
	configName: 'BigBrain',
	globals: {
		hideNullImageValues: true,
		useNehubaLayout: {
			keepDefaultLayouts: false,
		},
		useNehubaMeshLayer: true,
		useNehubaSingleMeshLayer: true,
		embedded: true,
		rightClickWithCtrlGlobal: false,
		zoomWithoutCtrlGlobal: false,
	},
	zoomWithoutCtrl: true,
	rightClickWithCtrl: true,
	rotateAtViewCentre : true,
	zoomAtViewCentre : true,
	restrictUserNavigation: true,
	// disableSegmentSelection: true,
	dataset: {
		imageBackground: WHITE,	
		initialNgState: BigBrainState,
	},
	layout: {
		views: 'hbp-neuro',
		planarSlicesBackground: WHITE,
		hideSliceViewsCheckbox: true,
		useNehubaPerspective: {
			enableShiftDrag: false,
			doNotRestrictUserNavigation: false,
			perspectiveSlicesBackground: WHITE,
			removePerspectiveSlicesBackground: {// true,
				color: WHITE,
				mode: '=='
			},
			perspectiveBackground: WHITE,
			fixedZoomPerspectiveSlices: {
				sliceViewportWidth: 300,
				sliceViewportHeight: 300,
				sliceZoom: 563818.3562426177,
				sliceViewportSizeMultiplier: 2,
			},
			mesh: {
				removeOctant: vec4.fromValues(-1.0, 1.0, 1.0, 1.0),
				backFaceColor: WHITE,
				removeBasedOnNavigation: true,
				flipRemovedOctant: true
			},
			centerToOrigin: true,
			drawSubstrates: {
				color: vec4.fromValues(0.0, 0.0, 1.0, 0.2),
			},
			drawZoomLevels: {
				cutOff: 200000,
				color: vec4.fromValues(1.0, 0.0, 0.0, 0.2),
			},
			hideImages: false,
			waitForMesh: true,
			restrictZoomLevel: {
				minZoom: 1200000,
				maxZoom: 3500000,
			},
		},
	},
}

export const JuBrain: Config = {
    globals: {
        hideNullImageValues: true,
        useNehubaLayout: true,
        useNehubaSingleMeshLayer: true,
		embedded:true,
    },
    zoomWithoutCtrl: true,
    rightClickWithCtrl: true,
	rotateAtViewCentre : true,
	zoomAtViewCentre : true,
    layout: {
        hideSliceViewsCheckbox: true,
        useNehubaPerspective: {
            fixedZoomPerspectiveSlices:
            {
                sliceViewportWidth: 300,
                sliceViewportHeight: 300,
                sliceZoom: 724698.1843689409,
                sliceViewportSizeMultiplier: 2
            },
            centerToOrigin: true,
            mesh: {
                removeBasedOnNavigation: true,
                flipRemovedOctant: true
            },
            removePerspectiveSlicesBackground: {
                mode: '=='
            },
            waitForMesh: true,
            drawSubstrates: {},
            drawZoomLevels: {
                cutOff: 150000,
            },
            restrictZoomLevel: {
                minZoom: 2500000,
                maxZoom: 3500000
            }
        },
    },
    dataset: {
        imageBackground: BLACK,
        initialNgState: JuBrainWithMesh
    },
}