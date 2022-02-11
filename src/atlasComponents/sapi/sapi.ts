import { BS_ENDPOINT } from 'src/util/constants';
import { Inject, Injectable } from "@angular/core";
import { SAPISpace } from './sapiSpace'
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SAPI{

  getSpace(atlasId: string, spaceId: string): SAPISpace {
    return new SAPISpace(this, atlasId, spaceId)
  }

  constructor(
    public http: HttpClient,
    @Inject(BS_ENDPOINT) public bsEndpoint: string,
  ){

  }
}
