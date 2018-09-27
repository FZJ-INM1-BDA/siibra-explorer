import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";


@Pipe({
  name : 'spatialLandmarksToDataBrowserItemPipe'
})

export class SpatialLandmarksToDataBrowserItemPipe implements PipeTransform{
  public transform(landmarks:any[]):{region:any, searchResults:Partial<DataEntry>[]}[]{
    return landmarks.map(landmark => ({
      region : Object.assign({}, landmark, {
        position : landmark.position.map(v => v*1e6),
        spatialLandmark : true
      }),
      searchResults : [{
        name : 'Associated dataset',
        type : 'Associated dataset',
        files : landmark.files
      }]
    }))
  }
}