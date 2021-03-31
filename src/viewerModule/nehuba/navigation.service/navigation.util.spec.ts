import {
  navAdd,
  navMul,
  navObjEqual,
  INavObj
} from './navigation.util'

const nav1: INavObj = {
  position: [1,2,3],
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [1, 0, 0, 0],
  perspectiveZoom: 100,
  zoom: -12
}

const nav1x2: INavObj = {
  position: [2,4,6],
  orientation: [0, 0, 0, 2],
  perspectiveOrientation: [2, 0, 0, 0],
  perspectiveZoom: 200,
  zoom: -24
}

const nav2: INavObj = {
  position: [5, 1, -3],
  orientation: [0, 0, 1, 0],
  perspectiveOrientation: [-3, 0, 0, 0],
  perspectiveZoom: 150,
  zoom: -60
}

const nav1p2: INavObj = {
  position: [6, 3, 0],
  orientation: [0, 0, 1, 1],
  perspectiveOrientation: [-2, 0, 0, 0],
  perspectiveZoom: 250,
  zoom: -72
}

describe('> navigation.util.ts', () => {
  describe('> navMul', () => {
    it('> should multiply nav object with scalar', () => {
      expect(
        navMul(nav1x2, 0.5)
      ).toEqual(nav1)
    })
  })

  describe('> navAdd', () => {
    it('> should add two nav obj', () => {
      expect(
        navAdd(nav1, nav2)
      ).toEqual(nav1p2)
    })
  })

  describe('> navObjEqual', () => {
    describe('> if inputs are strictly equal', () => {
      it('> if two objects are inav obj', () => {
        expect(
          navObjEqual(nav1, nav1)
        ).toBeTrue()
      })
      it('> if two objects are both null', () => {
        expect(
          navObjEqual(null, null)
        ).toBeTrue()
      })
      it('> if two objects are both undefined', () => {
        const obj = {}
        expect(
          navObjEqual(obj['plus'], obj['bla'])
        ).toBeTrue()
      })
    })

    describe('> if inputs are not strictly eqal', () => {
      describe('> if either inputs are falsy', () => {
        it('> if the other argument is falsy, return false', () => {
          const obj = {}
          expect(
            navObjEqual(obj['plug'], null)
          ).toBeFalse()
        })

        it('> if the other argument is valid, returns false', () => {
          expect(
            navObjEqual(null, nav1)
          ).toBeFalse()
        })
      })
    
      describe('> if both inputs are valid obj', () => {
        it('> should return false if different value', () => {
          expect(
            navObjEqual(nav1, nav2)
          ).toBeFalse()
        })

        it('> should return true if same value', () => {
          expect(
            navObjEqual(
              navMul(nav1, 2),
              nav1x2
            )
          ).toBeTrue()
        })
      })
    })
  })

})