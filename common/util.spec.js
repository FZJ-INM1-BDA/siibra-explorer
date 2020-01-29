import { getIdFromFullId } from './util'

describe('common/util.js', () => {
  describe('getIdFromFullId', () => {
    it('should return correct kgId for regions fetched from kg', () => {
      const id = 'https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationregion/v1.0.0/675a6ce9-ef26-4e68-9852-54afeb24923c'
      expect(getIdFromFullId(id)).toBe('minds/core/parcellationregion/v1.0.0/675a6ce9-ef26-4e68-9852-54afeb24923c')
    })
  
    it('should return correct id for regions in hierarchy', () => {
      const fullId = {
        "kg": {
          "kgSchema": "minds/core/parcellationregion/v1.0.0",
          "kgId": "a844d80f-1d94-41a0-901a-14ae257519db"
        }
      }
      expect(getIdFromFullId(fullId)).toBe(`minds/core/parcellationregion/v1.0.0/a844d80f-1d94-41a0-901a-14ae257519db`)
    })
  })
})
