/**
 * path to nested children should successfully convert flat array to nested objects
 */

import { PathToNestedChildren } from './pathToNestedChildren.pipe'

import {} from 'jasmine'

const array1 = [{
  pizza : 'pineapple',
  path : 'root1'
},{
  path: 'root2'
}]

const expectedArray1 = [{
  pizza : 'pineapple',
  path : 'root1',
  children : []
},{
  path : 'root2',
  children : []
}]

const array2 = [{
  path : 'root'
},{
  path : 'root/dir'
}]
const expectedArray2 = [{
  path : 'root',
  children : [{
    path : 'dir',
    children : []
  }]
}]

const array3 = [{
  name : 'eagle',
  path : 'root1/dir1'
},{
  path : 'root1/dir2'
},{
  path : 'root2/dir3'
},{
  path : 'root2/dir4'
}]
const expectedArray3 = [{
  path : 'root1',
  children : [{
    name : 'eagle',
    path : 'dir1',
    children : []
  },{
    path : 'dir2',
    children : []
  }]
},{
  path :'root2',
  children :[{
    path : 'dir3',
    children : []
  },{
    path : 'dir4',
    children : []
  }]
}]

const array4 = [{
  path : 'root1/3\\/4'
}]

const expectedArray4 = [{
  path : 'root1',
  children : [{
    path : '3\\/4',
    children : []
  }]
}]

const pipe = new PathToNestedChildren()

describe('path to nested children', () => {
  it('jasmine works', () => {
    expect(1).toBe(1)
  })

  it('transforms all single heirachy to a flat structure', () => {
    const transformed = pipe.transform(array1)
    expect(transformed).toEqual(expectedArray1)
  })

  it('transforms nested hierachy correctly', () => {
    
    const transformed2 = pipe.transform(array2)
    expect(transformed2).toEqual(expectedArray2)

    const transformed3 = pipe.transform(array3)
    expect(transformed3).toEqual(expectedArray3)
  })

  it('handles escapes characters fine', () => {
    const transformed4 = pipe.transform(array4)
    expect(transformed4).toEqual(expectedArray4)
  })
})