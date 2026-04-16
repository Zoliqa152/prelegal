import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppTitleService {
  subtitle = signal('Legal Document Creator');
}
