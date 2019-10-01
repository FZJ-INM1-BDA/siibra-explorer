import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'canvasToBlobPipe'
})

export class CanvastoBlobPipe implements PipeTransform{
  public transform(canvas:HTMLCanvasElement): Promise<Blob>{
    if (!canvas) return Promise.resolve(null)
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png')
    })
  }
}