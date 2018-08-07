import { CopyPropertyPipe } from './copyProperty.pipe'
import {} from 'jasmine'

describe('copyProperty.pipe works as expected', () => {
  it('jasmine works', () => {
    expect(1).toBe(1)
  })
  it('pipe should work', () => {
    const pipe = new CopyPropertyPipe()
    const array = [{
      name : 'name1',
      key1 : 'value1'
    },{
      name : 'name2',
      key1 : 'value2'
    }]
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
  })
})