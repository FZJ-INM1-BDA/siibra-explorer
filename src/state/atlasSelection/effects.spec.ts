describe("> effects.ts", () => {
  describe("> Effect", () => {

    describe('> selectTemplate$', () => {

      describe('> when transiting from template A to template B', () => {
        describe('> if the current navigation is correctly formed', () => {
          it('> uses current navigation param', () => {

          })
        })

        describe('> if current navigation is malformed', () => {
          it('> if current navigation is undefined, use nehubaConfig of last template', () => {
          })
  
          it('> if current navigation is empty object, use nehubaConfig of last template', () => {
          })
        })
  
      })

      it('> if coordXform returns error', () => {

      })

      it('> if coordXform complete', () => {

      })

    })
  
    describe('> if selected atlas has no matching tmpl space', () => {

      it('> should emit gernal error', () => {

      })
    })

    describe('> if selected atlas has matching tmpl', () => {

      describe('> if parc is empty array', () => {
        it('> should emit with falsy as payload', () => {

        })
      })
      describe('> if no parc has eligible @id', () => {

        it('> should emit with falsy as payload', () => {

        })
      })

      describe('> if some parc has eligible @id', () => {
        describe('> if no @version is available', () => {

          it('> selects the first parc', () => {

          })
        })

        describe('> if @version is available', () => {
          
          describe('> if there exist an entry without @next attribute', () => {
            
            it('> selects the first one without @next attribute', () => {
            })
          })
          describe('> if there exist no entry without @next attribute', () => {
            
            it('> selects the first one without @next attribute', () => {

            })
          })
        })
      })
    })

    describe('> onNavigateToRegion', () => {

      describe('> if atlas, template, parc is not set', () => {

        describe('> if atlas is unset', () => {
          it('> returns general error', () => {
          })
        })
        describe('> if template is unset', () => {
          it('> returns general error', () => {
          })
        })
        describe('> if parc is unset', () => {
          it('> returns general error', () => {
          })
        })
      })
      describe('> if atlas, template, parc is set, but region unset', () => {
        it('> returns general error', () => {
        })
      })

      describe('> if inputs are fine', () => {
        it('> getRegionDetailSpy is called', () => {
        })

        describe('> mal formed return', () => {
          describe('> returns null', () => {
            it('> generalactionerror', () => {
            })
          })
          describe('> general throw', () => {

            it('> generalactionerror', () => {
            })

          })
          describe('> does not contain props attr', () => {
            it('> generalactionerror', () => {
            })
          })

          describe('> does not contain props.length === 0', () => {
            it('> generalactionerror', () => {
            })
          })
        })

        describe('> wellformed response', () => {
          beforeEach(() => {

            beforeEach(() => {
            })

            it('> emits navigateTo', () => {

            })
          })
        })
      })
    })
  })
})