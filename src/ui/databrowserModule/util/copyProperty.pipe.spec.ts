import { CopyPropertyPipe } from './copyProperty.pipe'
import {} from 'jasmine'

const array = [{
  name : 'name1',
  key1 : 'value1'
},{
  name : 'name2',
  key1 : 'value2'
},{
  name : 'name3',
  key1 : 'value3',
  key2 : 'oldvalue3'
},{
  name : 'name4',
  key2 : 'oldValue4'
}]

describe('copyProperty.pipe works as expected', () => {
  it('jasmine works', () => {
    expect(1).toBe(1)
  })
  it('copyProperty pipe should copy value of key1 as value of key2, even means overwriting old value', () => {
    const pipe = new CopyPropertyPipe()
    const newItem = pipe.transform(array,'key1','key2')
    
    expect(newItem[0]).toEqual({
      name : 'name1',
      key1 : 'value1',
      key2 : 'value1'
    })

    expect(newItem[1]).toEqual({
      name : 'name2',
      key1 : 'value2',
      key2 : 'value2'
    })

    expect(newItem[2]).toEqual({
      name : 'name3',
      key1 : 'value3',
      key2 : 'value3'
    })

    expect(newItem[3]).toEqual({
      name : 'name4',
      key2 : undefined
    })
  })
  it('if given undefined or null as array input, will return an emtpy array', () => {
    const pipe = new CopyPropertyPipe()
    const nullItem = pipe.transform(null,'key1','key2')
    expect(nullItem).toEqual([])

    const undefinedItem = pipe.transform(undefined, 'key1','key2')
    expect(undefinedItem).toEqual([])
  })
  it('if either keys are undefined, return the original array, or emtpy array if original array is undefined', () => {
    const pipe = new CopyPropertyPipe()
    const nokey1 = pipe.transform(array, null, 'key2')
    expect(nokey1).toEqual(array)
    
    const nokey2 = pipe.transform(array, 'key1', null)
    expect(nokey2).toEqual(array)
  })
})