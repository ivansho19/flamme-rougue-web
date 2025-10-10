import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  loaderService = new Subject();
  
  getLoaderState() {
    return this.loaderService.asObservable();
  }

  setLoaderState(state: boolean) {
    this.loaderService.next({state})
  }
}
