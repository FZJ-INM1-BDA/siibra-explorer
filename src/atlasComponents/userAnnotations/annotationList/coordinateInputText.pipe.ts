import {Pipe, PipeTransform} from "@angular/core";

@Pipe({ name: 'coordinateInputText'})
export class CoordinateInputTextPipe implements PipeTransform {
  transform(coordinate: number[]) {
    return coordinate.map(c => `${c.toFixed(3) }mm`).join(', ')
  }
}
