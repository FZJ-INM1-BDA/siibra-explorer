import { cvtNavigationObjToNehubaConfig } from './util'

const currentNavigation = {
  position: [4, 5, 6],
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [ 0, 0, 0, 1],
  perspectiveZoom: 2e5,
  zoom: 1e5
}

const defaultPerspectiveZoom = 1e6
const defaultZoom = 1e6

const defaultNavigationObject = {
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [0 , 0, 0, 1],
  perspectiveZoom: defaultPerspectiveZoom,
  zoom: defaultZoom,
  position: [0, 0, 0],
  positionReal: true
}

const defaultNehubaConfigObject = {
  perspectiveOrientation: [0, 0, 0, 1],
  perspectiveZoom: 1e6,
  navigation: {
    pose: {
      position: {
        voxelCoordinates: [0, 0, 0],
        voxelSize: [1,1,1]
      },
      orientation: [0, 0, 0, 1],
    },
    zoomFactor: defaultZoom
  }
}

const bigbrainNehubaConfig = {
  "showDefaultAnnotations": false,
  "layers": {
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
          -21.8844051361084,
          16.288618087768555,
          28.418994903564453
        ]
      }
    },
    "zoomFactor": 350000
  },
  "perspectiveOrientation": [
    0.3140767216682434,
    -0.7418519854545593,
    0.4988985061645508,
    -0.3195493221282959
  ],
  "perspectiveZoom": 1922235.5293810747
}

describe('> util.ts', () => {
  
  describe('> cvtNavigationObjToNehubaConfig', () => {
    const validNavigationObj = currentNavigation
    describe('> if inputs are malformed', () => {
      describe('> if navigation object is malformed, uses navigation default object', () => {
        it('> if navigation object is null', () => {
          const v1 = cvtNavigationObjToNehubaConfig(null, bigbrainNehubaConfig)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, bigbrainNehubaConfig)
          expect(v1).toEqual(v2)
        })
        it('> if navigation object is undefined', () => {
          const v1 = cvtNavigationObjToNehubaConfig(undefined, bigbrainNehubaConfig)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, bigbrainNehubaConfig)
          expect(v1).toEqual(v2)
        })

        it('> if navigation object is otherwise malformed', () => {
          const v1 = cvtNavigationObjToNehubaConfig({foo: 'bar'}, bigbrainNehubaConfig)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, bigbrainNehubaConfig)
          expect(v1).toEqual(v2)

          const v3 = cvtNavigationObjToNehubaConfig({}, bigbrainNehubaConfig)
          const v4 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, bigbrainNehubaConfig)
          expect(v3).toEqual(v4)
        })
      })

      describe('> if nehubaConfig object is malformed, use default nehubaConfig obj', () => {
        it('> if nehubaConfig is null', () => {
          const v1 = cvtNavigationObjToNehubaConfig(validNavigationObj, null)
          const v2 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v1).toEqual(v2)
        })

        it('> if nehubaConfig is undefined', () => {
          const v1 = cvtNavigationObjToNehubaConfig(validNavigationObj, undefined)
          const v2 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v1).toEqual(v2)
        })

        it('> if nehubaConfig is otherwise malformed', () => {
          const v1 = cvtNavigationObjToNehubaConfig(validNavigationObj, {})
          const v2 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v1).toEqual(v2)

          const v3 = cvtNavigationObjToNehubaConfig(validNavigationObj, {foo: 'bar'})
          const v4 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v3).toEqual(v4)
        })
      })
    })
    it('> converts navigation object and reference nehuba config object to navigation object', () => {
      const convertedVal = cvtNavigationObjToNehubaConfig(validNavigationObj, bigbrainNehubaConfig)
      const { perspectiveOrientation, orientation, zoom, perspectiveZoom, position } = validNavigationObj
      
      expect(convertedVal).toEqual({
        navigation: {
          pose: {
            position: {
              voxelSize: bigbrainNehubaConfig.navigation.pose.position.voxelSize,
              voxelCoordinates: [0, 1, 2].map(idx => position[idx] / bigbrainNehubaConfig.navigation.pose.position.voxelSize[idx])
            },
            orientation
          },
          zoomFactor: zoom
        },
        perspectiveOrientation: perspectiveOrientation,
        perspectiveZoom: perspectiveZoom
      })
    })
  })

})
