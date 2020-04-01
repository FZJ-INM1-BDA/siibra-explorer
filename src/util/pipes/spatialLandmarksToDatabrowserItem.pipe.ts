import { Pipe, PipeTransform } from "@angular/core";
import { IDataEntry, ILandmark, IPlaneLandmarkGeometry, IPointLandmarkGeometry } from "../../services/stateStore.service";

@Pipe({
  name : 'spatialLandmarksToDataBrowserItemPipe',
})

export class SpatialLandmarksToDataBrowserItemPipe implements PipeTransform {
  public transform(landmarks: ILandmark[]): Array<{region: any, searchResults: Array<Partial<IDataEntry>>}> {
    return landmarks.map(landmark => ({
      region : Object.assign({}, landmark, {
        spatialLandmark : true,
      }, landmark.geometry.type === 'point'
        ? {
          position : (landmark.geometry as IPointLandmarkGeometry).position.map(v => v * 1e6),
        }
        : landmark.geometry.type === 'plane'
          ? {
            POIs : (landmark.geometry as IPlaneLandmarkGeometry).corners.map(corner => corner.map(coord => coord * 1e6)),
          }
          : {}),
      searchResults : [{
        name : 'Associated dataset',
        type : 'Associated dataset',
        files : landmark.files,
      }],
    }))
  }
}
