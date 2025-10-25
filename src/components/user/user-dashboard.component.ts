import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { LogService } from '../../services/log.service';
import { QuestionnaireData, User } from '../../models';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

type UserSection = 'dashboard' | 'new-appointment' | 'history' | 'profile';
type LaminaUnguealOption = 'descamacao' | 'descolamento' | 'manchas' | 'estrias';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeToggleComponent],
  templateUrl: './user-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent implements OnInit {
  authService = inject(AuthService);
  dataService = inject(DataService);
  logService = inject(LogService);

  currentUser = computed(() => this.authService.currentUser() as User);
  activeSection = signal<UserSection>('dashboard');
  isMenuOpen = signal(false);
  isSaving = signal(false);

  // For new appointment
  services = this.dataService.services;
  selectedServiceId = signal<number | null>(null);
  appointmentDate = signal('');
  appointmentTime = signal('');
  
  // Profile editing
  editingProfileData = signal<Partial<User & { newPassword?: string }>>({});
  profilePicture = computed(() => {
    const editingUrl = this.editingProfileData().photoUrl;
    if (editingUrl) return editingUrl;
    const currentUrl = this.currentUser()?.photoUrl;
    if (currentUrl) return currentUrl;
    return `https://api.dicebear.com/8.x/initials/svg?seed=${this.currentUser()?.name}`;
  });
  editError = signal('');
  
  // Questionnaire
  yesNoQuestions: { key: keyof Omit<QuestionnaireData, 'laminaUngueal' | 'outros'>, label: string }[] = [
    { key: 'gestacao', label: 'Está em período de gestação?' }, { key: 'roerUnhas', label: 'Tem o hábito de roer unhas?' },
    { key: 'alergia', label: 'Possui algum tipo de alergia?' }, { key: 'retirarCuticula', label: 'Costuma retirar a cutícula?' },
    { key: 'micose', label: 'Tem ou já teve micose?' }, { key: 'medicamento', label: 'Faz uso de algum medicamento?' },
    { key: 'atividadeFisica', label: 'Pratica atividade física regularmente?' }, { key: 'piscinaPraia', label: 'Frequenta piscina ou praia?' },
    { key: 'diabetes', label: 'Tem diabetes?' }, { key: 'unhaEncravada', label: 'Tem unhas encravadas?' },
  ];

  laminaUnguealOptions: LaminaUnguealOption[] = ['descamacao', 'descolamento', 'manchas', 'estrias'];
  private initialQuestionnaireState: QuestionnaireData = { gestacao: 'nao', roerUnhas: 'nao', alergia: 'nao', retirarCuticula: 'nao', micose: 'nao', medicamento: 'nao', atividadeFisica: 'nao', piscinaPraia: 'nao', diabetes: 'nao', unhaEncravada: 'nao', laminaUngueal: [], outros: '' };
  questionnaire = signal<QuestionnaireData>({ ...this.initialQuestionnaireState });

  userAppointments = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.dataService.appointments().filter(app => app.userId === user.id).map(app => this.dataService.getAppointmentDetails(app)).sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  });

  upcomingAppointments = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.userAppointments().filter(app => app.date >= todayStr && app.status === 'confirmed').sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());
  });
  
  ngOnInit() {
    this.editingProfileData.set({ ...this.currentUser() });
  }

  selectSection(section: UserSection) {
    this.activeSection.set(section);
    if (section === 'new-appointment') this.resetBookingForm();
    if (section === 'profile') this.resetProfileForm();
    this.isMenuOpen.set(false);
  }

  toggleMenu() { this.isMenuOpen.update(v => !v); }
  
  updateQuestionnaireField(field: keyof QuestionnaireData, value: any) { this.questionnaire.update(q => ({ ...q, [field]: value })); }

  isLaminaUnguealSelected(option: LaminaUnguealOption): boolean { return this.questionnaire().laminaUngueal.includes(option); }

  onLaminaUnguealChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value as LaminaUnguealOption;
    this.questionnaire.update(q => {
      const currentValues = q.laminaUngueal;
      if (target.checked) return { ...q, laminaUngueal: [...currentValues, value] };
      return { ...q, laminaUngueal: currentValues.filter(v => v !== value) };
    });
  }

  onOutrosInputChange(event: Event) { this.updateQuestionnaireField('outros', (event.target as HTMLTextAreaElement).value); }

  bookAppointment() {
    const user = this.currentUser();
    if (!user || !this.selectedServiceId() || !this.appointmentDate() || !this.appointmentTime() || this.isSaving()) return;

    this.isSaving.set(true);
    setTimeout(() => {
      try {
        const appointmentData = { userId: user.id, serviceId: this.selectedServiceId()!, date: this.appointmentDate(), time: this.appointmentTime(), questionnaire: this.questionnaire() };
        this.dataService.addAppointment(appointmentData);
        this.logService.log('Appointment Booked', { userId: user.id, serviceId: this.selectedServiceId() });
        alert('Agendamento confirmado com sucesso!');
        this.selectSection('dashboard');
      } finally {
        this.isSaving.set(false);
      }
    }, 500);
  }

  private resetBookingForm() {
    this.selectedServiceId.set(null); this.appointmentDate.set(''); this.appointmentTime.set('');
    this.questionnaire.set({ ...this.initialQuestionnaireState });
  }

  // Profile Methods
  handleProfileFormChange(event: Event, field: keyof User | 'newPassword') {
    const value = (event.target as HTMLInputElement).value;
    this.editingProfileData.update(d => ({ ...d, [field]: value }));
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.editingProfileData.update(d => ({ ...d, photoUrl: e.target?.result as string }));
      reader.readAsDataURL(file);
    }
  }

  saveProfileChanges() {
    if (this.isSaving()) return;
    const updatedData = this.editingProfileData();
    if (updatedData.newPassword && updatedData.newPassword.length < 3) {
      this.editError.set('A nova senha é muito curta.'); return;
    }
    this.isSaving.set(true);
    setTimeout(() => {
        try {
            const userToSave: User = {
                id: this.currentUser().id, name: updatedData.name || this.currentUser().name,
                email: updatedData.email || this.currentUser().email, isLoyal: this.currentUser().isLoyal,
                birthday: this.currentUser().birthday, photoUrl: updatedData.photoUrl || this.currentUser().photoUrl,
            };
            this.dataService.updateUser(userToSave);
            this.authService.currentUser.set(userToSave);
            this.logService.log('Profile Updated', { userId: userToSave.id });
            alert('Perfil atualizado com sucesso!');
            this.editError.set('');
        } finally {
            this.isSaving.set(false);
        }
    }, 500);
  }

  private resetProfileForm() {
    this.editingProfileData.set({ ...this.currentUser() });
    this.editError.set('');
  }

  logout() { this.authService.logout(); }
}