import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TopRojoModalState {
  isOpen: boolean;
  profileId: string;
  city: string;
  country: string;
}

@Injectable({
  providedIn: 'root'
})
export class TopRojoModalService {
  private initialState: TopRojoModalState = {
    isOpen: false,
    profileId: '',
    city: '',
    country: ''
  };

  private modalState$ = new BehaviorSubject<TopRojoModalState>(this.initialState);

  constructor() { }

  /**
   * Obtener estado del modal como observable
   */
  getModalState(): Observable<TopRojoModalState> {
    return this.modalState$.asObservable();
  }

  /**
   * Abrir modal con datos
   */
  openModal(profileId: string, city: string, country: string): void {
    this.modalState$.next({
      isOpen: true,
      profileId,
      city,
      country
    });
  }

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.modalState$.next(this.initialState);
  }

  /**
   * Obtener estado actual
   */
  getCurrentState(): TopRojoModalState {
    return this.modalState$.value;
  }
}
