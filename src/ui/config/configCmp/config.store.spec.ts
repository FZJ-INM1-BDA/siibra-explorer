import {ConfigStore} from "src/ui/config/configCmp/config.store";

describe('> config.store.ts', () => {
    describe('> Viewer config', () => {

        let configStore
        beforeEach(() => {
            configStore = new ConfigStore()
            configStore.setState({
                sliceBackground: [],
                axisLineVisible: false,
                togglePerspectiveViewSubstrate: false
            })
        })

        it('set axlisLineVisible visibility', (done) => {
            configStore.setAxisLineVisible(true)
            configStore.state$.subscribe((state) => {
                expect(state.axisLineVisible).toBeTrue()
                done()
            })

        })

        describe('set slice background color', () => {
            it('set background with hex string', (done) => {
                configStore.setSliceBackground('#32a852')
                configStore.state$.subscribe((state) => {
                    expect(state.sliceBackground).toEqual([50, 168, 82, 0.2])
                    done()
                })
            })
            it('set background with rgb', (done) => {
                configStore.setSliceBackground([50, 50, 50])
                configStore.state$.subscribe((state) => {
                    expect(state.sliceBackground).toEqual([50, 50, 50, 0.2])
                    done()
                })
            })
            it('set background with rgba', (done) => {
                configStore.setSliceBackground([0, 0, 0, 1])
                configStore.state$.subscribe((state) => {
                    expect(state.sliceBackground).toEqual([0, 0, 0, 1])
                    done()
                })
            })

        })

        it('set background visibility', (done) => {
            configStore.setBackgroundVisibility(true)
            configStore.state$.subscribe((state) => {
                expect(state.togglePerspectiveViewSubstrate).toBeTrue()
                done()
            })
        })

    })
})
