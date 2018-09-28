import { Pipe, PipeTransform } from "@angular/core";
import { DataEntry, Landmark, PointLandmarkGeometry, PlaneLandmarkGeometry } from "../../services/stateStore.service";


@Pipe({
  name : 'spatialLandmarksToDataBrowserItemPipe'
})

export class SpatialLandmarksToDataBrowserItemPipe implements PipeTransform{
  public transform(landmarks:Landmark[]):{region:any, searchResults:Partial<DataEntry>[]}[]{
    return landmarks.map(landmark => ({
      region : Object.assign({}, landmark, {
        spatialLandmark : true
      }, landmark.geometry.type === 'point'
        ? {
          position : (landmark.geometry as PointLandmarkGeometry).position.map(v => v*1e6),
        }
        : landmark.geometry.type === 'plane' 
          ? {
            POIs : (landmark.geometry as PlaneLandmarkGeometry).corners.map(corner => corner.map(coord => coord * 1e6))
          }
          : {}),
      searchResults : [{
        name : 'Associated dataset',
        type : 'Associated dataset',
        files : landmark.files
      }]
    }))
  }
}