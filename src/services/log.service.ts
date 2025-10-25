import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LogService {
  log(action: string, data?: object) {
    const timestamp = new Date().toISOString();
    console.log(`[LOG - ${timestamp}] Action: ${action}`, data || '');
  }
}
