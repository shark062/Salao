import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
<button (click)="toggleTheme()"
        class="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-500 dark:text-indigo-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-950 focus:ring-indigo-500"
        aria-label="Toggle theme">
  <!-- Sun Icon -->
  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform duration-300" 
       [class.rotate-90]="theme() === 'dark'"
       [class.scale-0]="theme() === 'dark'"
       fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
  <!-- Moon Icon -->
  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 absolute transition-transform duration-300"
       [class.-rotate-90]="theme() === 'light'"
       [class.scale-0]="theme() === 'light'"
       fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);
  theme = this.themeService.theme;

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
