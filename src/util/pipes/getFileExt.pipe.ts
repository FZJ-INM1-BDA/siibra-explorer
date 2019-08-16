import { PipeTransform, Pipe } from "@angular/core";

const NIFTI = `NIFTI Volume`
const VTK = `VTK Mesh`

const extMap = new Map([
  ['.nii', NIFTI],
  ['.nii.gz', NIFTI],
  ['.vtk', VTK]
])

@Pipe({
  name: 'getFileExtension'
})

export class GetFileExtension implements PipeTransform{
  private regex: RegExp = new RegExp('(\\.[\\w\\.]*?)$')

  private getRegexp(ext){
    return new RegExp(`${ext.replace(/\./g, '\\.')}$`, 'i')
  }

  private detFileExt(filename:string):string{
    for (let [key, val] of extMap){
      if(this.getRegexp(key).test(filename)){
        return val
      }
    }
    return filename
  }

  public transform(filename:string):string{
    return this.detFileExt(filename)
  }
}

