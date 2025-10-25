
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, ThemeToggleComponent]
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  error = signal<string | null>(null);
  satisfaction = signal(0);
  showSatisfaction = signal(false);

  constructor(private authService: AuthService) {}

  onLogin() {
    this.error.set(null);
    const loggedIn = this.authService.login(this.username(), this.password());
    if (!loggedIn) {
      this.error.set('Usuário ou senha inválidos.');
    }
  }

  setSatisfaction(rating: number) {
    this.satisfaction.set(rating);
    setTimeout(() => this.showSatisfaction.set(true), 500);
  }
}