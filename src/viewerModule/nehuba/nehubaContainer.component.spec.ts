
// const { 
//   TOGGLE_SIDE_PANEL,
//   EXPAND,
//   COLLAPSE,
//   ZOOM_IN,
//   ZOOM_OUT,
//   TOGGLE_FRONTAL_OCTANT
// } = ARIA_LABELS

// const bigbrainJson = {
//   ..._bigbrainJson,
//   nehubaConfig: _bigbrainNehubaConfigJson
// }
// const importNehubaSpy = jasmine.createSpy('importNehubaSpy').and.returnValue(Promise.reject())

describe('> nehubaContainer.component.ts', () => {

  describe('> NehubaContainer', () => {

    // beforeEach(async(() => {

    //   TestBed.configureTestingModule({
    //     imports: [
    //       NoopAnimationsModule,
    //       WidgetModule,
    //       AngularMaterialModule,
    //       LayoutModule,
    //       UtilModule,
    //       NehubaModule,
    //       AuthModule,
    //       StateModule,
    //       FormsModule,
    //       ReactiveFormsModule,
    //       HttpClientModule,
    //       CommonModule,
    //       RegionalFeaturesModule,
    //       ParcellationRegionModule,
    //       AtlasCmpParcellationModule,

    //       /**
    //        * because the change done to pureconstant service, need to intercept http call to avoid crypto error message
    //        * so and so components needs to be compiled first. make sure you call compileComponents
    //        */
    //       HttpClientTestingModule,
    //       Landmark2DModule,
    //     ],
    //     declarations: [
    //       NehubaContainer,
    //       TouchSideClass,
    //       MaximisePanelButton,
    //       AtlasLayerSelector,
    //       StatusCardComponent,
    //       NehubaViewerTouchDirective,
    //       MobileOverlay,
          
    //       SplashScreen,
    //       CurrentLayout,
  
    //       // pipes
    //       MobileControlNubStylePipe,
    //       ReorderPanelIndexPipe,
          
    //       RegionAccordionTooltipTextPipe,
    //     ],
    //     providers: [
    //       provideMockStore({ initialState: defaultRootState }),
    //       {
    //         provide: IMPORT_NEHUBA_INJECT_TOKEN,
    //         useValue: importNehubaSpy
    //       },
    //       PureContantService,
    //     ],
    //     schemas: [
    //       CUSTOM_ELEMENTS_SCHEMA
    //     ],
    //   }).compileComponents()
      
    // }))

    
    // const fixture = TestBed.createComponent(NehubaContainer)
    // fixture.componentInstance.currentOnHoverObs$ = hot('')
    // const el = fixture.debugElement.componentInstance
    // expect(el).toBeTruthy()
    it('> component can be created')

    describe('> on selectedTemplatechange', () => {

      // const fixture = TestBed.createComponent(NehubaContainer)
      // fixture.componentInstance.currentOnHoverObs$ = hot('')

      // const mockStore = TestBed.inject(MockStore)
      // const newState = {
      //   ...defaultRootState,
      //   viewerState: {
      //     ...defaultRootState.viewerState,
      //     fetchedTemplates: [ bigbrainJson ],
      //     templateSelected: bigbrainJson,
      //     parcellationSelected: bigbrainJson.parcellations[0]
      //   },
      //   [viewerStateHelperStoreName]: {
      //     fetchedAtlases: [ humanAtlas ],
      //     selectedAtlasId: humanAtlas['@id']
      //   }
      // }

      // mockStore.setState(newState)
      // fixture.detectChanges()
      // expect(importNehubaSpy).toHaveBeenCalled()
      it('> calls importNehubaPr')

      /**
       * TODO perhaps move this to e2e?
       */
      it('> drag handle reattaches properly')
    })

    describe('> on selectedparcellation change', () => {


      // const fixture = TestBed.createComponent(NehubaContainer)
      // fixture.componentInstance.currentOnHoverObs$ = hot('')
      // const el = fixture.debugElement.componentInstance as NehubaContainer
      // const mockStore = TestBed.inject(MockStore)
      // const newState = {
      //   ...defaultRootState,
      //   viewerState: {
      //     ...defaultRootState.viewerState,
      //     fetchedTemplates: [ bigbrainJson ],
      //     templateSelected: bigbrainJson,
      //     parcellationSelected: bigbrainJson.parcellations[0]
      //   },
      //   [viewerStateHelperStoreName]: {
      //     fetchedAtlases: [ humanAtlas ],
      //     selectedAtlasId: humanAtlas['@id']
      //   }
      // }

      // mockStore.setState(newState)
      // fixture.detectChanges()

      // const setSpy = spyOnProperty(el.nehubaViewer, 'ngIds', 'set')

      // const newState2 = {
      //   ...defaultRootState,
      //   viewerState: {
      //     ...defaultRootState.viewerState,
      //     fetchedTemplates: [ bigbrainJson ],
      //     templateSelected: bigbrainJson,
      //     parcellationSelected: bigbrainJson.parcellations[1]
      //   },
      //   [viewerStateHelperStoreName]: {
      //     fetchedAtlases: [ humanAtlas ],
      //     selectedAtlasId: humanAtlas['@id']
      //   }
      // }

      // mockStore.setState(newState2)
      // fixture.detectChanges()

      // expect(setSpy).toHaveBeenCalled()
      it('> should set ngId of nehubaViewer')
    })

    describe('> extended sidepanel hides and shows as expected', () => {
      describe('> on start, if nothing is selected', () => {
        // beforeEach(() => {
        //   const mockStore = TestBed.inject(MockStore)
        //   const newState = {
        //     ...defaultRootState,
        //     viewerState: {
        //       ...defaultRootState.viewerState,
        //       fetchedTemplates: [ bigbrainJson ],
        //       templateSelected: bigbrainJson,
        //       parcellationSelected: bigbrainJson.parcellations[0]
        //     },
        //     [viewerStateHelperStoreName]: {
        //       fetchedAtlases: [ humanAtlas ],
        //       selectedAtlasId: humanAtlas['@id']
        //     }
        //   }

        //   mockStore.setState(newState)
        // })



        // const fixture = TestBed.createComponent(NehubaContainer)
        // fixture.componentInstance.currentOnHoverObs$ = hot('')
        // fixture.detectChanges()
        // expect(
        //   fixture.componentInstance.matDrawerMain.opened
        // ).toEqual(false)
        // expect(
        //   fixture.componentInstance.matDrawerMinor.opened
        // ).toEqual(false)
        it('> both should be shut')


        // const fixture = TestBed.createComponent(NehubaContainer)
        // fixture.componentInstance.currentOnHoverObs$ = hot('')
        // fixture.detectChanges()
        // const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
        // toggleBtn.triggerEventHandler('click', null)
        // fixture.detectChanges()
        
        // expect(
        //   fixture.componentInstance.matDrawerMain.opened
        // ).toEqual(true)
        // expect(
        //   fixture.componentInstance.matDrawerMinor.opened
        // ).toEqual(false)
        it('> opening via tab should result in only top drawer open')



        // const fixture = TestBed.createComponent(NehubaContainer)
        // fixture.componentInstance.currentOnHoverObs$ = hot('')
        // fixture.detectChanges()
        // const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
        // toggleBtn.triggerEventHandler('click', null)
        // fixture.detectChanges()
        // const expandRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${EXPAND}"]`) )
        // expect(expandRegionFeatureBtn).toBeNull()
        it('> on opening top drawer, explore features should not be present')


        // const fixture = TestBed.createComponent(NehubaContainer)
        // fixture.componentInstance.currentOnHoverObs$ = hot('')
        // fixture.detectChanges()
        // const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
        // toggleBtn.triggerEventHandler('click', null)
        // fixture.detectChanges()
        // const expandRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
        // expect(expandRegionFeatureBtn).toBeNull()
        it('> collapse btn should not be visible')
      })

      describe('> on start, if something is selected', () => {
        // beforeEach(() => {
        //   const mockStore = TestBed.inject(MockStore)
        //   const newState = {
        //     ...defaultRootState,
        //     viewerState: {
        //       ...defaultRootState.viewerState,
        //       fetchedTemplates: [ bigbrainJson ],
        //       templateSelected: bigbrainJson,
        //       parcellationSelected: bigbrainJson.parcellations[0],
        //       regionsSelected: [{
        //         name: "foobar",
        //         ngId: 'untitled',
        //         labelIndex: 15
        //       }]
        //     },
        //     [viewerStateHelperStoreName]: {
        //       fetchedAtlases: [ humanAtlas ],
        //       selectedAtlasId: humanAtlas['@id']
        //     }
        //   }

        //   mockStore.setState(newState)
        // })


        // const fixture = TestBed.createComponent(NehubaContainer)
        // fixture.componentInstance.currentOnHoverObs$ = hot('')
        // fixture.detectChanges()
        // expect(
        //   fixture.componentInstance.matDrawerMain.opened
        // ).toEqual(true)
        // expect(
        //   fixture.componentInstance.matDrawerMinor.opened
        // ).toEqual(true)

        // expect(
        //   fixture.componentInstance.navSideDrawerMainSwitch.switchState
        // ).toEqual(true)
        // expect(
        //   fixture.componentInstance.navSideDrawerMinorSwitch.switchState
        // ).toEqual(true)
        it('> both should be open')


        // () => {
        //   const fixture = TestBed.createComponent(NehubaContainer)
        //   fixture.componentInstance.currentOnHoverObs$ = hot('')
        //   fixture.detectChanges()
        //   const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
        //   toggleBtn.triggerEventHandler('click', null)
        //   fixture.detectChanges()
        //   expect(
        //     fixture.componentInstance.matDrawerMain.opened
        //   ).toEqual(false)

        //   /**
        //    * TODO investigate why openedStart/closedStart events fail to fire
        //    */
        //   // expect(
        //   //   fixture.componentInstance.matDrawerMinor.opened
        //   // ).toEqual(false)

        //   // expect(
        //   //   fixture.componentInstance.navSideDrawerMainSwitch.switchState
        //   // ).toEqual(false)
        //   // expect(
        //   //   fixture.componentInstance.navSideDrawerMinorSwitch.switchState
        //   // ).toEqual(false)
        // }
        it('> closing main drawer via tag should close both')


        // () => {

        //   const fixture = TestBed.createComponent(NehubaContainer)
        //   fixture.componentInstance.currentOnHoverObs$ = hot('')
        //   fixture.detectChanges()
        //   const collapseRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
        //   expect(collapseRegionFeatureBtn).not.toBeNull()
        // }
        it('> collapse btn should be visible')

        // () => {

        //   const fixture = TestBed.createComponent(NehubaContainer)
        //   fixture.componentInstance.currentOnHoverObs$ = hot('')
        //   fixture.detectChanges()
        //   const collapseRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
        //   collapseRegionFeatureBtn.triggerEventHandler('click', null)
        //   fixture.detectChanges()
        //   expect(
        //     fixture.componentInstance.matDrawerMain.opened
        //   ).toEqual(true)

        //   /**
        //    * TODO investigate why property does not get updated
        //    */
        //   // expect(
        //   //   fixture.componentInstance.matDrawerMinor.opened
        //   // ).toEqual(false)

        //   expect(
        //     fixture.componentInstance.navSideDrawerMainSwitch.switchState
        //   ).toEqual(true)
        //   expect(
        //     fixture.componentInstance.navSideDrawerMinorSwitch.switchState
        //   ).toEqual(false)
        // }
        it('> clicking on collapse btn should minimize 1 drawer')

        // () => {
        //   const fixture = TestBed.createComponent(NehubaContainer)
        //   fixture.componentInstance.currentOnHoverObs$ = hot('')
        //   fixture.detectChanges()
        //   const collapseRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
        //   collapseRegionFeatureBtn.triggerEventHandler('click', null)
        //   fixture.detectChanges()
        //   const expandRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-primary-open="true"] [aria-label="${EXPAND}"]`) )
        //   expandRegionFeatureBtn.triggerEventHandler('click', null)
        //   fixture.detectChanges()

        //   expect(
        //     fixture.componentInstance.matDrawerMain.opened
        //   ).toEqual(true)
        //   expect(
        //     fixture.componentInstance.matDrawerMinor.opened
        //   ).toEqual(true)

        //   expect(
        //     fixture.componentInstance.navSideDrawerMainSwitch.switchState
        //   ).toEqual(true)
        //   /**
        //    * TODO figoure out why switch state is updated async, and karma can't force update state
        //    */
        //   // expect(
        //   //   fixture.componentInstance.navSideDrawerMinorSwitch.switchState
        //   // ).toEqual(true)
        // }
        it('> on minimize drawer, clicking expand btn should expand everything')
      })

      describe('> side bar content', () => {

        /**
         * TODO
         */
        it('> if nothing is shown, it should show place holder text')

        /**
         * TODO
         */
        it('> if something (region features/connectivity) exists, placeh holder text should be hdiden')
      })
    })
  
    describe('> panelCtrl', () => {
      // let fixture: ComponentFixture<NehubaContainer>
      // const setViewerLoaded = () => {
      //   fixture.componentInstance.viewerLoaded = true
      // }
      // const ctrlElementIsVisible = (el: DebugElement) => {
      //   const visible = (el.nativeElement as HTMLElement).getAttribute('data-viewer-controller-visible')
      //   return visible === 'true'
      // }
      // beforeEach(() => {
      //   fixture = TestBed.createComponent(NehubaContainer)
      // })

      // () => {
      //   fixture.detectChanges()
      //   setViewerLoaded()
      //   fixture.detectChanges()
      //   for (const idx of [0, 1, 2, 3]) {
      //     const el = fixture.debugElement.query(
      //       By.css(`[data-viewer-controller-index="${idx}"]`)
      //     )
      //     expect(el).toBeTruthy()
      //   }
      // }
      it('> on start, all four ctrl panels exists')

      // () => {
        
      //   fixture.detectChanges()
      //   setViewerLoaded()
      //   fixture.detectChanges()
      //   for (const idx of [0, 1, 2, 3]) {
      //     const el = fixture.debugElement.query(
      //       By.css(`[data-viewer-controller-index="${idx}"]`)
      //     )
      //     expect(ctrlElementIsVisible(el)).toBeFalsy()
      //   }
      // }
      it('> on start all four ctrl panels are invisible')

      describe('> on hover, only the hovered panel have ctrl shown', () => {

        for (const idx of [0, 1, 2, 3]) {
          
          // fakeAsync(() => {
          //   fixture.detectChanges()
          //   const findPanelIndexSpy = spyOn<any>(fixture.componentInstance, 'findPanelIndex').and.callFake(() => {
          //     return idx
          //   })
          //   setViewerLoaded()
          //   fixture.detectChanges()
          //   const nativeElement = fixture.componentInstance['elementRef'].nativeElement
          //   nativeElement.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  
          //   /**
          //    * assert findPanelIndex called with event.target, i.e. native element in thsi case
          //    */
          //   expect(findPanelIndexSpy).toHaveBeenCalledWith(nativeElement)
          //   tick(200)
          //   fixture.detectChanges()
            
          //   /**
          //    * every panel index should be non visible
          //    * only when idx matches, it can be visible
          //    * n.b. this does not test visual visibility (which is controlled by extra-style.css)
          //    * (which is also affected by global [ismobile] configuration)
          //    * 
          //    * this merely test the unit logic, and sets the flag appropriately
          //    */
          //   for (const iterativeIdx of [0, 1, 2, 3]) {
          //     const el = fixture.debugElement.query(
          //       By.css(`[data-viewer-controller-index="${iterativeIdx}"]`)
          //     )
          //     if (iterativeIdx === idx) {
          //       expect(ctrlElementIsVisible(el)).toBeTruthy()
          //     } else {
          //       expect(ctrlElementIsVisible(el)).toBeFalsy()
          //     }
          //   }
          //   discardPeriodicTasks()
          // })
          it(`> on hoveredPanelIndices$ emit ${idx}, the panel index ${idx} ctrl becomes visible`)
        }
  
      })

      describe('> on maximise top right slice panel (idx 1)', () => {
        // beforeEach(() => {
        //   const mockStore = TestBed.inject(MockStore)
        //   mockStore.overrideSelector(ngViewerSelectorPanelMode, PANELS.SINGLE_PANEL)
        //   mockStore.overrideSelector(ngViewerSelectorPanelOrder, '1230')

        //   fixture.detectChanges()
        //   setViewerLoaded()
        //   fixture.detectChanges()
        // })


        // () => {

        //   const toggleBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${TOGGLE_FRONTAL_OCTANT}"]`)
        //   )
        //   expect(toggleBtn).toBeFalsy()
        // }
        it('> toggle front octant btn not visible')

        // () => {

        //   const zoomInBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${ZOOM_IN}"]`)
        //   )

        //   const zoomOutBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${ZOOM_OUT}"]`)
        //   )

        //   expect(zoomInBtn).toBeTruthy()
        //   expect(zoomOutBtn).toBeTruthy()
        // }
        it('> zoom in and out btns are visible')

        // () => {
        //   const zoomViewSpy = spyOn(fixture.componentInstance, 'zoomNgView')

        //   const zoomInBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${ZOOM_IN}"]`)
        //   )
        //   zoomInBtn.triggerEventHandler('click', null)
        //   expect(zoomViewSpy).toHaveBeenCalled()
        //   const { args } = zoomViewSpy.calls.first()
        //   expect(args[0]).toEqual(1)
        //   /**
        //    * zoom in < 1
        //    */
        //   expect(args[1]).toBeLessThan(1)
        // }
        it('> zoom in btn calls fn with right param')

        // () => {
        //   const zoomViewSpy = spyOn(fixture.componentInstance, 'zoomNgView')

        //   const zoomOutBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${ZOOM_OUT}"]`)
        //   )
        //   zoomOutBtn.triggerEventHandler('click', null)
        //   expect(zoomViewSpy).toHaveBeenCalled()
        //   const { args } = zoomViewSpy.calls.first()
        //   expect(args[0]).toEqual(1)
        //   /**
        //    * zoom out > 1
        //    */
        //   expect(args[1]).toBeGreaterThan(1)
        // }
        it('> zoom out btn calls fn with right param')
      })

      describe('> on maximise perspective panel', () => {
        // beforeEach(() => {
        //   const mockStore = TestBed.inject(MockStore)
        //   mockStore.overrideSelector(ngViewerSelectorPanelMode, PANELS.SINGLE_PANEL)
        //   mockStore.overrideSelector(ngViewerSelectorPanelOrder, '3012')

        //   fixture.detectChanges()
        //   setViewerLoaded()
        //   fixture.detectChanges()
        // })


        // () => {
        //   const setOctantRemovalSpy = spyOn(fixture.componentInstance, 'setOctantRemoval')

        //   const toggleBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${TOGGLE_FRONTAL_OCTANT}"]`)
        //   )
        //   expect(toggleBtn).toBeTruthy()
        //   toggleBtn.nativeElement.dispatchEvent(
        //     new MouseEvent('click', { bubbles: true })
        //   )
        //   expect(setOctantRemovalSpy).toHaveBeenCalled()
        // }
        it('> toggle octant btn visible and functional')

        // () => {
        //   const zoomViewSpy = spyOn(fixture.componentInstance, 'zoomNgView')

        //   const zoomInBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${ZOOM_IN}"]`)
        //   )
        //   expect(zoomInBtn).toBeTruthy()

        //   zoomInBtn.triggerEventHandler('click', null)
        //   expect(zoomViewSpy).toHaveBeenCalled()
        //   const { args } = zoomViewSpy.calls.first()
        //   expect(args[0]).toEqual(3)
        //   /**
        //    * zoom in < 1
        //    */
        //   expect(args[1]).toBeLessThan(1)
        // }
        it('> zoom in btn visible and functional')

        // () => {
        //   const zoomViewSpy = spyOn(fixture.componentInstance, 'zoomNgView')

        //   const zoomOutBtn = fixture.debugElement.query(
        //     By.css(`[cell-i] [aria-label="${ZOOM_OUT}"]`)
        //   )
        //   expect(zoomOutBtn).toBeTruthy()

        //   zoomOutBtn.triggerEventHandler('click', null)
        //   expect(zoomViewSpy).toHaveBeenCalled()
        //   const { args } = zoomViewSpy.calls.first()
        //   expect(args[0]).toEqual(3)
        //   /**
        //    * zoom in < 1
        //    */
        //   expect(args[1]).toBeGreaterThan(1)
        // }
        it('> zoom out btn visible and functional')
      
      })
    })
  
    describe('> on userLandmarks change', () => {
      const lm1 = {
        id: 'test-1',
        position: [0, 0, 0]
      }
      const lm2 = {
        id: 'test-2',
        position: [1, 1,1 ]
      }

      // () => {
      //   const fixture = TestBed.createComponent(NehubaContainer)

      //   fixture.componentInstance.nehubaViewer = {
      //     updateUserLandmarks: () => {}
      //   } as any

      //   const updateUserLandmarksSpy = spyOn(
      //     fixture.componentInstance.nehubaViewer,
      //     'updateUserLandmarks'
      //   )

      //   const mockStore = TestBed.inject(MockStore)
      //   mockStore.overrideSelector(viewerStateCustomLandmarkSelector, [
      //     lm1, 
      //     lm2
      //   ])
      //   fixture.detectChanges()
      //   expect(
      //     updateUserLandmarksSpy
      //   ).toHaveBeenCalledWith([
      //     lm1, lm2
      //   ])
      // }
      it('> calls nehubaViewer.updateUserLandmarks')
    
      // () => {
        
      //   const fixture = TestBed.createComponent(NehubaContainer)

      //   fixture.componentInstance.nehubaContainerDirective = {
      //     toggleOctantRemoval: () => {},
      //     clear: () => {}
      //   } as any

      //   const toggleOctantRemovalSpy = spyOn(
      //     fixture.componentInstance.nehubaContainerDirective,
      //     'toggleOctantRemoval'
      //   )

      //   const mockStore = TestBed.inject(MockStore)
      //   mockStore.overrideSelector(viewerStateCustomLandmarkSelector, [
      //     lm1, 
      //     lm2
      //   ])
      //   mockStore.overrideSelector(ngViewerSelectorOctantRemoval, true)
      //   fixture.detectChanges()
      //   expect(
      //     toggleOctantRemovalSpy
      //   ).toHaveBeenCalledWith(false)
      // }
      it('> calls togglecotantREmoval')
    })
  })
})
