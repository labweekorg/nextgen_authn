import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Load from storage on init
    this.loadUserFromStorage();
  }

  setUser(user: any, token?: string) {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    if (token) {
      localStorage.setItem('authToken', token);
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
  }



  logout() {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  private loadUserFromStorage() {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    if (user && token) {
      this.currentUserSubject.next(JSON.parse(user));
      this.isAuthenticatedSubject.next(true);
    }
  }
  getUser() {
    return this.currentUserSubject.value;
  }
}