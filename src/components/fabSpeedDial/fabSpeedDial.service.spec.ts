import { FabSpeedDialService } from './fabSpeedDial.service'

describe('FabSpeedDialService', () => {
  let service: FabSpeedDialService
  let openStateNextSpy: jasmine.Spy

  beforeEach(() => {
    service = new FabSpeedDialService()
    openStateNextSpy = spyOn(service.openState$, 'next').and.callThrough()
  })

  it('can be instantiated', () => {
    expect(service).not.toBeNull()
  })

  it('toggle calls openState$.next', () => {
    const isOpen = service.isOpen
    service.toggle()
    expect(openStateNextSpy).toHaveBeenCalledWith(!isOpen)
    expect(service.isOpen).toEqual(!isOpen)
  })

  it('close calls openState$.next', () => {
    service.close()
    expect(openStateNextSpy).toHaveBeenCalledWith(false)
    expect(service.isOpen).toEqual(false)
  })

  it('open calls openState$.next', () => {
    service.open()
    expect(openStateNextSpy).toHaveBeenCalledWith(true)
    expect(service.isOpen).toEqual(true)
  })
  
})