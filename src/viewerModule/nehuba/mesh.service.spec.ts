import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector } from "src/services/state/viewerState/selectors"
import { getLayerNameIndiciesFromParcRs, collateLayerNameIndicies, findFirstChildrenWithLabelIndex, NehubaMeshService } from "./mesh.service"


const fits1 = {
  ngId: 'foobar',
  labelIndex: 123,
  children: []
}

const fits1_1 = {
  ngId: 'foobar',
  labelIndex: 5,
  children: []
}

const fits2 = {
  ngId: 'helloworld',
  labelIndex: 567,
  children: []
}

const fits2_1 = {
  ngId: 'helloworld',
  labelIndex: 11,
  children: []
}

const nofit1 = {
  ngId: 'bazz',
  children: []
}

const nofit2 = {
  ngId: 'but',
  children: []
}

describe('> mesh.server.ts', () => {
  describe('> findFirstChildrenWithLabelIndex', () => {
    it('> if root fits, return root', () => {
      const result = findFirstChildrenWithLabelIndex({
        ...fits1,
        children: [fits2]
      })

      expect(result).toEqual([{
        ...fits1,
        children: [fits2]
      }])
    })

    it('> if root doesnt fit, will try to find the next node, until one fits', () => {
      const result = findFirstChildrenWithLabelIndex({
        ...nofit1,
        children: [fits1, fits2]
      })
      expect(result).toEqual([fits1, fits2])
    })

    it('> if notthings fits, will return empty array', () => {
      const result = findFirstChildrenWithLabelIndex({
        ...nofit1,
        children: [nofit1, nofit2]
      })
      expect(result).toEqual([])
    })
  })

  describe('> collateLayerNameIndicies', () => {
    it('> collates same ngIds', () => {
      const result = collateLayerNameIndicies([
        fits1_1, fits1, fits2, fits2_1
      ])
      expect(result).toEqual({
        [fits1.ngId]: [fits1_1.labelIndex, fits1.labelIndex],
        [fits2.ngId]: [fits2.labelIndex, fits2_1.labelIndex]
      })
    })
  })

  describe('> getLayerNameIndiciesFromParcRs', () => {
    const root = {
      ...fits1,
      children: [
        {
          ...nofit1,
          children: [
            {
              ...fits1_1,
              children: [
                fits2, fits2_1
              ]
            }
          ]
        }
      ]
    }
    const parc = {
      regions: [ root ]
    }
    it('> if selectedRegion.length === 0, selects top most regions with labelIndex', () => {
      const result = getLayerNameIndiciesFromParcRs(parc, [])
      expect(result).toEqual({
        [root.ngId]: [root.labelIndex]
      })
    })

    it('> if selReg.length !== 0, select region ngId & labelIndex', () => {
      const result = getLayerNameIndiciesFromParcRs(parc, [ fits1_1 ])
      expect(result).toEqual({
        [fits1_1.ngId]: [fits1_1.labelIndex]
      })
    })
  })

  describe('> NehubaMeshService', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore(),
          NehubaMeshService,
        ]
      })
    })

    it('> can be init', () => {
      const service = TestBed.inject(NehubaMeshService)
      expect(service).toBeTruthy()
    })

    it('> mixes in auxillaryMeshIndices', () => {
      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {
        auxillaryMeshIndices: [11, 22]
      })
      mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [ fits1 ])
      const service = TestBed.inject(NehubaMeshService)
      expect(
        service.loadMeshes$
      ).toBeObservable(
        hot('a', {
          a: {
            layer: {
              name: fits1.ngId
            },
            labelIndicies: [ fits1.labelIndex, 11, 22 ]
          }
        })
      )
    })
  })
})
