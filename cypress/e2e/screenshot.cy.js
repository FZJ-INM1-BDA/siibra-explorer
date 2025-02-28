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

    // monkey patck cypress issue (?) with resize observer
    // https://github.com/cypress-io/cypress/issues/27415#issuecomment-2169155274
    cy.on('window:before:load', (win) => {
      // store real observer
      const RealResizeObserver = ResizeObserver;

      let queueFlushTimeout;
      let queue = [];

      /**
       * ResizeObserver wrapper with "enforced batches"
       */
      class ResizeObserverPolyfill {
        constructor(callback) {
          this.callback = callback;
          this.observer = new RealResizeObserver(this.check.bind(this));
        }

        observe(element) {
          this.observer.observe(element);
        }

        unobserve(element) {
          this.observer.unobserve(element);
        }

        disconnect() {
          this.observer.disconnect();
        }

        check(entries) {
          // remove previous invocations of "self"
          queue = queue.filter((x) => x.cb !== this.callback);
          // put a new one
          queue.push({ cb: this.callback, args: entries });
          // trigger update
          if (!queueFlushTimeout) {
            queueFlushTimeout = requestAnimationFrame(() => {
              queueFlushTimeout = undefined;
              const q = queue;
              queue = [];
              q.forEach(({ cb, args }) => cb(args));
            }, 0);
          }
        }
      }
      win.ResizeObserver = ResizeObserverPolyfill
      
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
})
