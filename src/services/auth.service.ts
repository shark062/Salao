import { Injectable, signal, inject } from '@angular/core';
import { User } from '../models';
import { DataService } from './data.service';
import { LogService } from './log.service';

type AuthState = 'loading' | 'user' | 'admin' | 'guest';
type CurrentUser = User | { name: 'Admin'; email: string; } | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private dataService = inject(DataService);
  private logService = inject(LogService);
  private readonly adminUser = 'Erides Souza';
  private readonly adminPass = '301985';

  currentUser = signal<CurrentUser>(null);
  authState = signal<AuthState>('loading');
  
  constructor() {
    // Simulate checking for a stored session on startup
    setTimeout(() => {
        if (this.authState() === 'loading') {
            this.authState.set('guest');
        }
    }, 500);
  }
  
  login(username: string, password_or_email: string): boolean {
    if (username === this.adminUser && password_or_email === this.adminPass) {
      const admin = { name: 'Admin', email: 'erides.souza@goldentouch.com' };
      this.currentUser.set(admin);
      this.authState.set('admin');
      this.logService.log('Admin Login', { username });
      return true;
    }
    
    // Mock user login
    if (password_or_email === '123') {
        const user = this.dataService.users().find(u => u.name.split(' ')[0].toLowerCase() === username.toLowerCase());
        if (user) {
            this.currentUser.set(user);
            this.authState.set('user');
            this.logService.log('User Login', { username: user.name });
            return true;
        }
    }

    return false;
  }
  
  logout() {
    this.logService.log('Logout', { username: this.currentUser()?.name });
    this.currentUser.set(null);
    this.authState.set('guest');
  }
}