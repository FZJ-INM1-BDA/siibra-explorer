import { extractLabelIdx } from './stateStore.service'

describe('extractLabelIdx funciton works as intended', () => {

  const treeExtremity1 = {
    name: 'e1',
    labelIndex : 1,
    children : []
  }
  
  const treeExtremity2 = {
    name : 'e2',
    labelIndex : '2',
    children : []
  }
  
  const treeExtremity3 = {
    name : 'e3',
    labelIndex : 3,
    children : null
  }
  const treeExtremityNull = {
    name : 'eNull',
    labelIndex : null,
    children : null
  }
  const treeExtremityUndefined = {
    name : 'eNull',
    children : null
  }
  const treeExtremityUndefined2 = {
    name : 'eNull',
  }
  
  it('works on a tree extremity', () => {
    expect(extractLabelIdx(treeExtremity1)).toEqual([1])
    expect(extractLabelIdx(treeExtremity2)).toEqual([2])
    expect(extractLabelIdx(treeExtremity3)).toEqual([3])
    expect(extractLabelIdx(treeExtremityNull)).toEqual([])
    expect(extractLabelIdx(treeExtremityUndefined)).toEqual([])
    expect(extractLabelIdx(treeExtremityUndefined2)).toEqual([])
  })

  it('works on tree branch', () => {
    const branch4 = {
      name : 'b4',
      children : [
        treeExtremity1,
        treeExtremity2
      ],
      labelIndex: 4
    }

    const branch5 = {
      name : 'b5',
      children : [
        treeExtremity2,
        treeExtremity3,
        treeExtremityNull
      ],
      labelIndex : '5'
    }

    const branchNull = {
      name : 'bNull',
      children : [
        treeExtremity1,
        treeExtremity2,
        treeExtremity3,
        treeExtremityNull
      ],
      labelIndex : null
    }

    const branchUndefined = {
      name : 'bNull',
      children : [
        treeExtremity1,
        treeExtremity2,
        treeExtremity3,
        treeExtremityNull
      ]
    }

    expect(extractLabelIdx(branch4)).toEqual([1,2,4])
    expect(extractLabelIdx(branch5)).toEqual([2,3,5])
    expect(extractLabelIdx(branchNull)).toEqual([1,2,3])
    expect(extractLabelIdx(branchUndefined)).toEqual([1,2,3])

  })
})