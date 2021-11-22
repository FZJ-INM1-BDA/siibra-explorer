import { Observable } from "rxjs";

export class NotFoundError extends Error{}

export interface IKeyValStore {
  getKeyVal(key: string): Observable<unknown>
  setKeyVal(key: string, val: unknown): Observable<void|string>
}
