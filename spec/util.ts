import { HttpInterceptor, HttpEvent, HttpHandler, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class HttpMockRequestInterceptor implements HttpInterceptor{

  intercept(request:HttpRequest<any>, next:HttpHandler):Observable<HttpEvent<any>> {
    const test = /\/datasets/.test(request.url)
    if (test) {

      const headers = new HttpHeaders()
      headers.set('content-type', 'application/json')

      return of(new HttpResponse({
        status: 200,
        body: [],
        headers
      }))
    } 
    return next.handle(request)
  }
}

export const JUBRAIN_COLIN_CH123_LEFT = {
  "name": "Ch 123 (Basal Forebrain) - left hemisphere",
  "rgb": [
    124,
    233,
    167
  ],
  "labelIndex": 286,
  "ngId": "jubrain colin v18 left",
  "children": [],
  "status": "publicP",
  "position": [
    -2339339,
    4405405,
    -8804805
  ]
}

export const JUBRAIN_COLIN_CH123_RIGHT = {
  "name": "Ch 123 (Basal Forebrain) - right hemisphere",
  "rgb": [
    124,
    233,
    167
  ],
  "ngId": "jubrain colin v18 right",
  "labelIndex": 286,
  "children": [],
  "status": "publicP",
  "position": [
    3240000,
    5153846,
    -8347692
  ]
}
