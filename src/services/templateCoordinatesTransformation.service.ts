import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class TemplateCoordinatesTransformation {

  constructor(private httpClient: HttpClient) {}

  getPointCoordinatesForTemplate(sourceTemplateName, targetTemplateName, coordinates) {
    const url = 'https://hbp-spatial-backend.apps-dev.hbp.eu/v1/transform-points'
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    }

    const convertedPoints = new Promise((resolve, reject) => {
      let timeOut = true
      setTimeout(() => {
        if (timeOut) reject('Timed out')
      },3000)

      this.httpClient.post(
        url,
        JSON.stringify({
          'source_points': [[...coordinates.map(c => c/1000000)]],
          'source_space': sourceTemplateName,
          'target_space': targetTemplateName
        }),
        httpOptions
      ).toPromise().then(
        res => {
          timeOut = false
          resolve(res['target_points'][0].map(r=> r*1000000))
        },
        msg => {
          timeOut = false
          reject(msg)
        }
      )
    })
    return convertedPoints
  }
}