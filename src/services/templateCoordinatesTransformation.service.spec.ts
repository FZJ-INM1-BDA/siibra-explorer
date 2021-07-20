import { TemplateCoordinatesTransformation } from './templateCoordinatesTransformation.service'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed, fakeAsync, tick } from '@angular/core/testing'

describe('templateCoordinatesTransformation.service.spec.ts', () => {
  describe('TemplateCoordinatesTransformation', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule
        ],
        providers: [
          TemplateCoordinatesTransformation
        ]
      })
    })

    afterEach(() => {
      const ctrl = TestBed.inject(HttpTestingController)
      ctrl.verify()
    })

    describe('getPointCoordinatesForTemplate', () => {
      it('should instantiate service properly', () => {
        const service = TestBed.inject(TemplateCoordinatesTransformation)
        expect(service).toBeTruthy()
        expect(service.getPointCoordinatesForTemplate).toBeTruthy()
      })

      it('should transform argument properly', () => {
        const service = TestBed.inject(TemplateCoordinatesTransformation)
        const httpTestingController = TestBed.inject(HttpTestingController)

        // subscriptions are necessary for http fetch to occur
        service.getPointCoordinatesForTemplate(
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.MNI152,
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN,
          [1,2,3]
        ).subscribe((_ev) => {
          
        })
        const req = httpTestingController.expectOne(service.url)
        expect(req.request.method).toEqual('POST')
        expect(
          JSON.parse(req.request.body)
        ).toEqual({
          'source_space': TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.MNI152,
          'target_space': TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN,
          'source_points': [
            [1e-6, 2e-6, 3e-6]
          ]
        })
        req.flush({})
      })

      it('transforms mapped space name(s)', () => {
        const service = TestBed.inject(TemplateCoordinatesTransformation)
        const httpTestingController = TestBed.inject(HttpTestingController)

        const key = Array.from(TemplateCoordinatesTransformation.NameMap.keys())[0]
        service.getPointCoordinatesForTemplate(
          key,
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN,
          [1,2,3]
        ).subscribe((_ev) => {
          
        })
        const req = httpTestingController.expectOne(service.url)
        expect(req.request.method).toEqual('POST')
        expect(
          JSON.parse(req.request.body)
        ).toEqual({
          'source_space': TemplateCoordinatesTransformation.NameMap.get(key),
          'target_space': TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN,
          'source_points': [
            [1e-6, 2e-6, 3e-6]
          ]
        })
        req.flush({})
      })


      it('should transform response properly', () => {

        const service = TestBed.inject(TemplateCoordinatesTransformation)
        const httpTestingController = TestBed.inject(HttpTestingController)

        service.getPointCoordinatesForTemplate(
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.MNI152,
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN,
          [1,2,3]
        ).subscribe(({ status, result }) => {
          expect(status).toEqual('completed')
          expect(result).toEqual([1e6, 2e6, 3e6])
        })
        const req = httpTestingController.expectOne(service.url)
        req.flush({
          'target_points':[
            [1, 2, 3]
          ]
        })
      })

      it('if server returns >=400, fallback gracefully', () => {
        const service = TestBed.inject(TemplateCoordinatesTransformation)
        const httpTestingController = TestBed.inject(HttpTestingController)

        service.getPointCoordinatesForTemplate(
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.MNI152,
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN,
          [1,2,3]
        ).subscribe(({ status }) => {
          expect(status).toEqual('error')
        })
        const req = httpTestingController.expectOne(service.url)
        
        req.flush('intercepted', { status: 500, statusText: 'internal server error' })
      })

      it('if server does not respond after 3s, fallback gracefully', fakeAsync(() => {

        const service = TestBed.inject(TemplateCoordinatesTransformation)
        const httpTestingController = TestBed.inject(HttpTestingController)

        service.getPointCoordinatesForTemplate(
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.MNI152,
          TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN,
          [1,2,3]
        ).subscribe(({ status, statusText }) => {
          expect(status).toEqual('error')
          expect(statusText).toEqual(`Timeout after 3s`)
        })
        const req = httpTestingController.expectOne(service.url)
        tick(4000)
        expect(req.cancelled).toBe(true)
      }))
    })
  })
})
