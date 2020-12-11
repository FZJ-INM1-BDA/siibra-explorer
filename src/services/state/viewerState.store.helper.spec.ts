import { isNewerThan } from "./viewerState.store.helper"

describe('> viewerState.store.helper.ts', () => {
  describe('> isNewerThan', () => {
    describe('> ill formed versions', () => {
      it('> in circular references, throws', () => {

        const parc0Circular = {

          "@version": {
            "@next": "aaa-bbb",
            "@this": "ccc-ddd",
            "name": "",
            "@previous": null,
          }
        }
        const parc1Circular = {
  
          "@version": {
            "@next": "ccc-ddd",
            "@this": "aaa-bbb",
            "name": "",
            "@previous": null,
          }
        }
        const p2 = {
          ["@id"]: "foo-bar"
        }
        const p3 = {
          ["@id"]: "baz"
        }
        expect(() => {
          isNewerThan([parc0Circular, parc1Circular], p2, p3)
        }).toThrow()
      })

      it('> if not found, will throw', () => {

        const parc0Circular = {

          "@version": {
            "@next": "aaa-bbb",
            "@this": "ccc-ddd",
            "name": "",
            "@previous": null,
          }
        }
        const parc1Circular = {
  
          "@version": {
            "@next": null,
            "@this": "aaa-bbb",
            "name": "",
            "@previous": null,
          }
        }
        const p2 = {
          ["@id"]: "foo-bar"
        }
        const p3 = {
          ["@id"]: "baz"
        }
        expect(() => {
          isNewerThan([parc0Circular, parc1Circular], p2, p3)
        }).toThrow()
      })
    })

    it('> works on well formed versions', () => {

      const parc0 = {
        "@version": {
          "@next": null,
          "@this": "aaa-bbb",
          "name": "",
          "@previous": "ccc-ddd",
        }
      }
      const parc1 = {
        "@version": {
          "@next": "aaa-bbb",
          "@this": "ccc-ddd",
          "name": "",
          "@previous": null,
        }
      }

      const p0 = {
        ['@id']: 'aaa-bbb'
      }
      const p1 = {
        ['@id']: 'ccc-ddd'
      }
      expect(
        isNewerThan([parc0, parc1], p0, p1)
      ).toBeTrue()
    })

  })
})