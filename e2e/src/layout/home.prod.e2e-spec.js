const { BasePage } = require('../util')

describe('> home.prod.e2e-spec.js', () => {
  describe('> home page', () => {
    it('> should load home page', async () => {
      const newPage = new BasePage()
      await newPage.init()
      await newPage.goto()
      const cards = await newPage.areVisible(`mat-card`)
      /**
       * expecting 3 atlases
       */
      expect(cards.length).toEqual(3)
    })
  })

  describe('> quickstart', () => {
    it('> should load quickstart page', async () => {

      const newPage = new BasePage()
      await newPage.init()
      await newPage.goto(`/quickstart`)
      const table = await newPage.areVisible(`table`)
      /**
       * expecting at least 1 table
       */
      expect(table.length).toBeGreaterThan(0)
    })
  })
})
