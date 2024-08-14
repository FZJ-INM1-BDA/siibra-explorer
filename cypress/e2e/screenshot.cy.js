const {
  SCREENSHOT_URL,
  SCREENSHOT_PATH,
} = Cypress.env()

describe(`Visiting ${SCREENSHOT_URL}`, () => {
  it(`Screenshot to ${SCREENSHOT_PATH}`, () => {
    if (!SCREENSHOT_URL) {
      console.error(`SCREENSHOT_URL not defined. Exiting`)
      return
    }

    cy.visit(SCREENSHOT_URL)
    cy.wait(10000)
    cy.get('body').type('{esc}')
    cy.wait(1000)
    cy.get('body').type('{esc}')

    if (!SCREENSHOT_PATH) {
      console.error(`SCREENSHOT_PATH not defined. Exiting`)
      return
    }
    cy.screenshot(SCREENSHOT_PATH)
  })
})
