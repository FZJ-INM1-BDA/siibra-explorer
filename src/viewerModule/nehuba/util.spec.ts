import { cvtNavigationObjToNehubaConfig } from './util'
const bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')
const bigBrainNehubaConfig = require('!json-loader!src/res/ext/bigbrainNehubaConfig.json')
const reconstitutedBigBrain = JSON.parse(JSON.stringify(
  {
    ...bigbrainJson,
    nehubaConfig: bigBrainNehubaConfig
  }
))
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

describe('> util.ts', () => {
  
  describe('> cvtNavigationObjToNehubaConfig', () => {
    const validNehubaConfigObj = reconstitutedBigBrain.nehubaConfig.dataset.initialNgState
    const validNavigationObj = currentNavigation
    describe('> if inputs are malformed', () => {
      describe('> if navigation object is malformed, uses navigation default object', () => {
        it('> if navigation object is null', () => {
          const v1 = cvtNavigationObjToNehubaConfig(null, validNehubaConfigObj)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
          expect(v1).toEqual(v2)
        })
        it('> if navigation object is undefined', () => {
          const v1 = cvtNavigationObjToNehubaConfig(undefined, validNehubaConfigObj)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
          expect(v1).toEqual(v2)
        })

        it('> if navigation object is otherwise malformed', () => {
          const v1 = cvtNavigationObjToNehubaConfig(reconstitutedBigBrain, validNehubaConfigObj)
          const v2 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
          expect(v1).toEqual(v2)

          const v3 = cvtNavigationObjToNehubaConfig({}, validNehubaConfigObj)
          const v4 = cvtNavigationObjToNehubaConfig(defaultNavigationObject, validNehubaConfigObj)
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

          const v3 = cvtNavigationObjToNehubaConfig(validNavigationObj, reconstitutedBigBrain)
          const v4 = cvtNavigationObjToNehubaConfig(validNavigationObj, defaultNehubaConfigObject)
          expect(v3).toEqual(v4)
        })
      })
    })
    it('> converts navigation object and reference nehuba config object to navigation object', () => {
      const convertedVal = cvtNavigationObjToNehubaConfig(validNavigationObj, validNehubaConfigObj)
      const { perspectiveOrientation, orientation, zoom, perspectiveZoom, position } = validNavigationObj
      
      expect(convertedVal).toEqual({
        navigation: {
          pose: {
            position: {
              voxelSize: validNehubaConfigObj.navigation.pose.position.voxelSize,
              voxelCoordinates: [0, 1, 2].map(idx => position[idx] / validNehubaConfigObj.navigation.pose.position.voxelSize[idx])
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
