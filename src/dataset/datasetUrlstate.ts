export const Colin27andMap = 

{
	"layers": {
		"colin": {
			"type": "image",
			"source": "precomputed://https://neuroglancer.humanbrainproject.org/precomputed/JuBrain/colin"
		},
		"atlas": {
			"type": "segmentation",
			"source": "precomputed://https://neuroglancer.humanbrainproject.org/precomputed/JuBrain/atlas"
		}
	},
	"navigation": {
		"pose": {
			"position": {
				"voxelSize": [
					1000000,
					1000000,
					1000000
				],
				"voxelCoordinates": [
					75.5,
					89.926513671875,
					70.05941009521484
				]
			}
		},
		"zoomFactor": 724698.1843689409
	},
	"perspectiveOrientation": [
		0.26040539145469666,
		-0.7640504240989685,
		0.5397806763648987,
		-0.23885725438594818
	],
	"perspectiveZoom": 2905161.84574797
};

export const BigBrainState = 
{
	"layers": {
		" grey value: ": {
			"type": "image",
			"source": "precomputed://https://neuroglancer.humanbrainproject.org/precomputed/BigBrainRelease.2015/8bit",
			"transform": [
				[
					1,
					0,
					0,
					-70666600
				],
				[
					0,
					1,
					0,
					-70000000
				],
				[
					0,
					0,
					1,
					-58777700
				],
				[
					0,
					0,
					0,
					1
				]
			]
		},
		" tissue type: ": {
			"type": "segmentation",
			"source": "precomputed://https://neuroglancer.humanbrainproject.org/precomputed/BigBrainRelease.2015/classif",
			"segments": [
				"100",
				"0"
			],
			"selectedAlpha": 0,
			"transform": [
				[
					1,
					0,
					0,
					-70666600
				],
				[
					0,
					1,
					0,
					-72910000
				],
				[
					0,
					0,
					1,
					-58777700
				],
				[
					0,
					0,
					0,
					1
				]
			]
		}
	},
	"navigation": {
		"pose": {
			"position": {
				"voxelSize": [
					21166.666015625,
					20000,
					21166.666015625
				],
				"voxelCoordinates": [
					// -501.35198974609375,
					// 241.81594848632812,
					// 481.2494201660156
					-21.8844051361084,
					16.288618087768555,
					28.418994903564453
				]
			}
		},
		"zoomFactor": 563818.3562426177
	},
	"perspectiveOrientation": [
		// 0.19238875806331635,
		// -0.794306755065918,
		// 0.5727782249450684,
		// -0.06314985454082489
		0.3140767216682434,
		-0.7418519854545593,
		0.4988985061645508,
		-0.3195493221282959
	],
	"perspectiveZoom": 1922235.5293810747
};

export const JuBrainWithMesh = 
{
	"layers": {
		"colin": {
			"type": "image",
			"source": "precomputed://http://neuroglancer.humanbrainproject.org/precomputed/JuBrain/colin",
			"transform": [
				[
					1,
					0,
					0,
					-75000000
				],
				[
					0,
					1,
					0,
					-115000000
				],
				[
					0,
					0,
					1,
					-63000000
				],
				[
					0,
					0,
					0,
					1
				]
			]
		},
		"atlas": {
			"type": "segmentation",
			"source": "precomputed://http://neuroglancer.humanbrainproject.org/precomputed/JuBrain/atlas",
			"transform": [
				[
					1,
					0,
					0,
					-75000000
				],
				[
					0,
					1,
					0,
					-115000000
				],
				[
					0,
					0,
					1,
					-63000000
				],
				[
					0,
					0,
					0,
					1
				]
			]
		},
		"mesh": {
			"type": "mesh",
			"source": "vtk://https://jubrain.fz-juelich.de/apps/neuroglancer/JuBrain/jubrain-mpm-surf.vtk",
			// "vertexAttributeSources": [],
			"shader": "vec3 colormap(float label) { \n if(label == 1.)\n return vec3(205., 0., 0.);\n if(label == 2.)\n return vec3(221., 160., 221.);\n if(label == 3.)\n return vec3(0., 0., 255.);\n if(label == 4.)\n return vec3(0., 255., 127.);\n if(label == 5.)\n return vec3(176., 224., 230.);\n if(label == 6.)\n return vec3(54., 255., 240.);\n if(label == 7.)\n return vec3(17., 250., 140.);\n if(label == 9.)\n return vec3(250., 128., 114.);\n if(label == 10.)\n return vec3(255., 153., 0.);\n if(label == 11.)\n return vec3(0., 50., 150.);\n if(label == 12.)\n return vec3(205., 0., 0.);\n if(label == 13.)\n return vec3(175., 238., 238.);\n if(label == 14.)\n return vec3(255., 200., 100.);\n if(label == 15.)\n return vec3(0., 147., 209.);\n if(label == 16.)\n return vec3(144., 238., 144.);\n if(label == 17.)\n return vec3(210., 180., 140.);\n if(label == 18.)\n return vec3(238., 238., 14.);\n if(label == 19.)\n return vec3(255., 255., 0.);\n if(label == 20.)\n return vec3(85., 107., 47.);\n if(label == 21.)\n return vec3(51., 0., 102.);\n if(label == 23.)\n return vec3(239., 134., 0.);\n if(label == 25.)\n return vec3(255., 200., 100.);\n if(label == 27.)\n return vec3(42., 60., 252.);\n if(label == 28.)\n return vec3(255., 239., 213.);\n if(label == 29.)\n return vec3(34., 200., 100.);\n if(label == 30.)\n return vec3(255., 200., 100.);\n if(label == 31.)\n return vec3(0., 100., 209.);\n if(label == 32.)\n return vec3(255., 204., 204.);\n if(label == 33.)\n return vec3(153., 204., 0.);\n if(label == 34.)\n return vec3(144., 238., 144.);\n if(label == 37.)\n return vec3(238., 232., 170.);\n if(label == 38.)\n return vec3(255., 165., 0.);\n if(label == 39.)\n return vec3(36., 157., 120.);\n if(label == 40.)\n return vec3(205., 133., 63.);\n if(label == 42.)\n return vec3(175., 238., 238.);\n if(label == 43.)\n return vec3(152., 251., 152.);\n if(label == 44.)\n return vec3(204., 255., 102.);\n if(label == 45.)\n return vec3(34., 200., 240.);\n if(label == 46.)\n return vec3(0., 209., 56.);\n if(label == 47.)\n return vec3(255., 200., 100.);\n if(label == 48.)\n return vec3(255., 255., 51.);\n if(label == 50.)\n return vec3(205., 0., 0.);\n if(label == 52.)\n return vec3(231., 120., 23.);\n if(label == 55.)\n return vec3(218., 112., 214.);\n if(label == 56.)\n return vec3(17., 250., 140.);\n if(label == 59.)\n return vec3(139., 71., 137.);\n if(label == 60.)\n return vec3(102., 0., 102.);\n if(label == 63.)\n return vec3(42., 60., 252.);\n if(label == 64.)\n return vec3(255., 218., 185.);\n if(label == 65.)\n return vec3(5., 198., 198.);\n if(label == 66.)\n return vec3(204., 51., 0.);\n if(label == 67.)\n return vec3(216., 150., 240.);\n if(label == 71.)\n return vec3(0., 146., 63.);\n if(label == 73.)\n return vec3(132., 194., 37.);\n if(label == 76.)\n return vec3(117., 197., 240.);\n if(label == 77.)\n return vec3(0., 147., 209.);\n if(label == 80.)\n return vec3(0., 0., 153.);\n if(label == 81.)\n return vec3(148., 0., 211.);\n if(label == 83.)\n return vec3(153., 153., 255.);\n if(label == 84.)\n return vec3(0., 209., 56.);\n if(label == 86.)\n return vec3(255., 192., 203.);\n if(label == 87.)\n return vec3(176., 196., 222.);\n if(label == 88.)\n return vec3(216., 191., 216.);\n if(label == 89.)\n return vec3(255., 0., 51.);\n if(label == 90.)\n return vec3(144., 238., 144.);\n if(label == 91.)\n return vec3(255., 69., 0.);\n if(label == 92.)\n return vec3(19., 255., 80.);\n if(label == 93.)\n return vec3(0., 255., 0.);\n if(label == 94.)\n return vec3(255., 10., 10.);\n if(label == 96.)\n return vec3(250., 30., 250.);\n if(label == 97.)\n return vec3(19., 255., 120.);\n if(label == 98.)\n return vec3(155., 100., 250.);\n if(label == 99.)\n return vec3(205., 0., 0.);\n if(label == 100.)\n return vec3(255., 20., 147.);\n return vec3(255., 255., 255.);\n}\n\nvoid main() {\n emitRGB(colormap(label) / 255.);\n}\n"
			// "vertexAttributeSources": [],
			// "shader": "void main() {\n  emitRGB(vec3(0.0,1.0,0.0));\n}\n"
		}
	},
	"navigation": {
		"pose": {
			"position": {
				"voxelSize": [
					1000000,
					1000000,
					1000000
				],
				"voxelCoordinates": [
					0,
					-32,
					0
				]
			}
		},
		"zoomFactor": 1000000
	},
	"perspectiveOrientation": [
		-0.2753947079181671,
		0.6631333827972412,
		-0.6360703706741333,
		0.2825356423854828
	],
	"perspectiveZoom": 3000000
}

export const JuBrainWithMesh2 = 
{
	"layers": {
		"colin": {
			"type": "image",
			"source": "precomputed://http://neuroglancer.humanbrainproject.org/precomputed/JuBrain/colin",
			"transform": [
				[
					1,
					0,
					0,
					-75000000
				],
				[
					0,
					1,
					0,
					-115000000
				],
				[
					0,
					0,
					1,
					-63000000
				],
				[
					0,
					0,
					0,
					1
				]
			]
		},
		"atlas": {
			"type": "segmentation",
			// "source": "precomputed://http://neuroglancer.humanbrainproject.org/precomputed/JuBrain/atlas",
			"source": "precomputed://https://jubrain.fz-juelich.de/apps/neuroglancer/JuBrain/jubrain-mpm-with-meshes-v0",
			"segments": [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 27, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 50, 52, 55, 56, 59, 60, 63, 64, 65, 66, 67, 71, 73, 76, 77, 80, 81, 83, 84, 86, 87, 88, 89, 90, 91, 92, 93, 94, 96, 97, 98, 99, 100, 0],
			// [
				// "14", "92", "90", "39",
				// "0"
			// ],			
			"transform": [
				[
					1,
					0,
					0,
					-75000000
				],
				[
					0,
					1,
					0,
					-115000000
				],
				[
					0,
					0,
					1,
					-63000000
				],
				[
					0,
					0,
					0,
					1
				]
			]
		},
		"mesh": {
			"type": "mesh",
			"source": "vtk://https://jubrain.fz-juelich.de/apps/neuroglancer/JuBrain/jubrain-mpm-surf.vtk",
			// "source": "vtk://http://li1672-15.members.linode.com/jubrain-mpm-surf.vtk",
			// "vertexAttributeSources": [],
			// "shader": "vec3 colormap(float label) { \n if(label == 1.)\n return vec3(205., 0., 0.);\n if(label == 2.)\n return vec3(221., 160., 221.);\n if(label == 3.)\n return vec3(0., 0., 255.);\n if(label == 4.)\n return vec3(0., 255., 127.);\n if(label == 5.)\n return vec3(176., 224., 230.);\n if(label == 6.)\n return vec3(54., 255., 240.);\n if(label == 7.)\n return vec3(17., 250., 140.);\n if(label == 9.)\n return vec3(250., 128., 114.);\n if(label == 10.)\n return vec3(255., 153., 0.);\n if(label == 11.)\n return vec3(0., 50., 150.);\n if(label == 12.)\n return vec3(205., 0., 0.);\n if(label == 13.)\n return vec3(175., 238., 238.);\n if(label == 14.)\n return vec3(255., 200., 100.);\n if(label == 15.)\n return vec3(0., 147., 209.);\n if(label == 16.)\n return vec3(144., 238., 144.);\n if(label == 17.)\n return vec3(210., 180., 140.);\n if(label == 18.)\n return vec3(238., 238., 14.);\n if(label == 19.)\n return vec3(255., 255., 0.);\n if(label == 20.)\n return vec3(85., 107., 47.);\n if(label == 21.)\n return vec3(51., 0., 102.);\n if(label == 23.)\n return vec3(239., 134., 0.);\n if(label == 25.)\n return vec3(255., 200., 100.);\n if(label == 27.)\n return vec3(42., 60., 252.);\n if(label == 28.)\n return vec3(255., 239., 213.);\n if(label == 29.)\n return vec3(34., 200., 100.);\n if(label == 30.)\n return vec3(255., 200., 100.);\n if(label == 31.)\n return vec3(0., 100., 209.);\n if(label == 32.)\n return vec3(255., 204., 204.);\n if(label == 33.)\n return vec3(153., 204., 0.);\n if(label == 34.)\n return vec3(144., 238., 144.);\n if(label == 37.)\n return vec3(238., 232., 170.);\n if(label == 38.)\n return vec3(255., 165., 0.);\n if(label == 39.)\n return vec3(36., 157., 120.);\n if(label == 40.)\n return vec3(205., 133., 63.);\n if(label == 42.)\n return vec3(175., 238., 238.);\n if(label == 43.)\n return vec3(152., 251., 152.);\n if(label == 44.)\n return vec3(204., 255., 102.);\n if(label == 45.)\n return vec3(34., 200., 240.);\n if(label == 46.)\n return vec3(0., 209., 56.);\n if(label == 47.)\n return vec3(255., 200., 100.);\n if(label == 48.)\n return vec3(255., 255., 51.);\n if(label == 50.)\n return vec3(205., 0., 0.);\n if(label == 52.)\n return vec3(231., 120., 23.);\n if(label == 55.)\n return vec3(218., 112., 214.);\n if(label == 56.)\n return vec3(17., 250., 140.);\n if(label == 59.)\n return vec3(139., 71., 137.);\n if(label == 60.)\n return vec3(102., 0., 102.);\n if(label == 63.)\n return vec3(42., 60., 252.);\n if(label == 64.)\n return vec3(255., 218., 185.);\n if(label == 65.)\n return vec3(5., 198., 198.);\n if(label == 66.)\n return vec3(204., 51., 0.);\n if(label == 67.)\n return vec3(216., 150., 240.);\n if(label == 71.)\n return vec3(0., 146., 63.);\n if(label == 73.)\n return vec3(132., 194., 37.);\n if(label == 76.)\n return vec3(117., 197., 240.);\n if(label == 77.)\n return vec3(0., 147., 209.);\n if(label == 80.)\n return vec3(0., 0., 153.);\n if(label == 81.)\n return vec3(148., 0., 211.);\n if(label == 83.)\n return vec3(153., 153., 255.);\n if(label == 84.)\n return vec3(0., 209., 56.);\n if(label == 86.)\n return vec3(255., 192., 203.);\n if(label == 87.)\n return vec3(176., 196., 222.);\n if(label == 88.)\n return vec3(216., 191., 216.);\n if(label == 89.)\n return vec3(255., 0., 51.);\n if(label == 90.)\n return vec3(144., 238., 144.);\n if(label == 91.)\n return vec3(255., 69., 0.);\n if(label == 92.)\n return vec3(19., 255., 80.);\n if(label == 93.)\n return vec3(0., 255., 0.);\n if(label == 94.)\n return vec3(255., 10., 10.);\n if(label == 96.)\n return vec3(250., 30., 250.);\n if(label == 97.)\n return vec3(19., 255., 120.);\n if(label == 98.)\n return vec3(155., 100., 250.);\n if(label == 99.)\n return vec3(205., 0., 0.);\n if(label == 100.)\n return vec3(255., 20., 147.);\n return vec3(255., 255., 255.);\n}\n\nvoid main() {\n emitRGB(colormap(label) / 255.);\n}\n"
		}
	},
	"navigation": {
		"pose": {
			"position": {
				"voxelSize": [
					1000000,
					1000000,
					1000000
				],
				"voxelCoordinates": [
					1.572378158569336,
					-27.08205795288086,
					12.474530220031738
				]
			}
		},
		"zoomFactor": 594025.3468725978
	},
	"perspectiveOrientation": [
		-0.2702370285987854,
		0.8032748699188232,
		-0.5037276744842529,
		0.167268306016922
	],
	"perspectiveZoom": 2953401.013386903
}