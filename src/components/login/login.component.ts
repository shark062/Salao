import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent, FormsModule],
  template: `
<div class="min-h-screen flex flex-col items-center justify-center p-4 relative">
  <div class="absolute top-4 right-4 z-10">
    <app-theme-toggle />
  </div>
  <div class="w-full max-w-md">

    <div class="text-center mb-8 animate-fade-in-down">
       <div class="flex items-center justify-center gap-3 text-4xl font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <h1 class="font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">
          ERIDES SOUZA ESTÚDIO
        </h1>
      </div>
      <p class="text-slate-500 dark:text-slate-400 mt-2">Sistema de Agendamento Online</p>
    </div>

    <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl dark:shadow-black/50 animate-fade-in-scale-up">
      <form (ngSubmit)="onLogin()" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-indigo-600 dark:text-indigo-400">Usuário</label>
          <div class="mt-1">
            <input 
              id="username" 
              name="username" 
              type="text" 
              required 
              [ngModel]="username()"
              (ngModelChange)="username.set($event)"
              class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-indigo-600 dark:text-indigo-400">Senha</label>
          <div class="mt-1">
            <input 
              id="password" 
              name="password" 
              type="password" 
              required
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        @if(error()) {
          <div class="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-2 rounded-lg text-sm animate-fade-in-down">
            {{ error() }}
          </div>
        }

        <div>
          <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all duration-200 ease-in-out hover:scale-105 active:scale-100">
            Entrar
          </button>
        </div>
      </form>
    </div>

    <!-- Satisfaction Survey -->
    <div class="mt-10 text-center animate-slide-in-up">
      <h3 class="text-slate-700 dark:text-slate-300 mb-4">Como você avalia sua última visita?</h3>
      <div class="flex justify-center space-x-2 text-3xl cursor-pointer">
        @for (star of [1, 2, 3, 4, 5]; track star) {
          <span 
            (click)="setSatisfaction(star)" 
            class="transition-all duration-200 hover:scale-125"
            [class.text-indigo-400]="satisfaction() >= star"
            [class.text-slate-300]="satisfaction() < star"
            [class.dark:text-slate-600]="satisfaction() < star"
            [class.scale-125]="satisfaction() === star"
            >★</span
          >
        }
      </div>
       @if(satisfaction() > 0 && !showSatisfaction()) {
        <div class="mt-4 space-y-3 animate-fade-in-down">
          <textarea 
            [ngModel]="comment()"
            (ngModelChange)="comment.set($event)"
            rows="3" 
            placeholder="Deixe um comentário (opcional)..." 
            class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"></textarea>
          <button (click)="submitFeedback()" class="w-full py-2 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition">
            Enviar Avaliação
          </button>
        </div>
      }
       @if(showSatisfaction()) {
        <p class="mt-4 text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 py-2 px-4 rounded-lg animate-pulse">
            Obrigado pelo seu feedback!
        </p>
       }
    </div>

  </div>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);
  
  username = signal('');
  password = signal('');
  error = signal('');

  satisfaction = signal(0);
  comment = signal('');
  showSatisfaction = signal(false);

  onLogin() {
    this.error.set('');
    const success = this.authService.login(this.username(), this.password());
    if (!success) {
      this.error.set('Usuário ou senha inválidos.');
    }
  }

  setSatisfaction(rating: number) {
    this.satisfaction.set(rating);
  }

  submitFeedback() {
    this.dataService.addFeedback({
      rating: this.satisfaction(),
      comment: this.comment(),
      date: new Date().toISOString().split('T')[0],
    });
    this.showSatisfaction.set(true);
    setTimeout(() => {
        this.showSatisfaction.set(false);
        this.satisfaction.set(0);
        this.comment.set('');
    }, 3000);
  }
}
