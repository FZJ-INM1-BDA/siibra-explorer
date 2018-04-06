import { KeyPipe } from './nehubaUI.util.pipes'
import {  } from 'jasmine' /* required or describe etc will be undefined */
// import { TestBed } from '@angular/core/testing'

describe('Testing Pipes',()=>{
  describe('Testing KeyPipe',()=>{
    let keyPipe : KeyPipe = new KeyPipe();
    
    it('should return keys of an object',()=>{
      const testObject = {
        key1:'value1',
        key2:'value2',
        key3:{
          key31:'value31',
          key32:'value32'
        }
      };
      expect(keyPipe.transform(testObject)).toEqual(['key1','key2','key3']);
    })

    it('should return indices of an array',()=>{
      const array:any[] = []
      expect(keyPipe.transform(array)).toEqual([])
      const array2:any[] = ['hello','world']
      expect(keyPipe.transform(array2)).toEqual(['0','1'])
      // const array3 = []
      // expect(keyPipe.transform(array3)).toEqual([])
    })

    it('should fail if a string is the input',()=>{
      const string = 'hello world'
      expect(()=>keyPipe.transform(string)).toThrow()
    })
  })

  
})