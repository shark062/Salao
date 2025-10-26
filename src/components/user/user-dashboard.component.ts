import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { AppointmentDetails, User, Appointment, QuestionnaireData } from '../../models';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, TitleCasePipe, ThemeToggleComponent, FormsModule],
  templateUrl: './user-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);

  // State
  isMenuOpen = signal(false);
  activeSection = signal('dashboard');
  isSaving = signal(false);

  // Data Signals
  currentUser = computed(() => this.authService.currentUser() as User | null);
  services = this.dataService.services;

  // Booking Form Signals
  selectedServiceId = signal<number | null>(null);
  appointmentDate = signal('');
  appointmentTime = signal('');
  
  // Profile Editing
  editingProfileData = signal<Partial<User & { newPassword?: string }>>({});
  profilePicture = signal(this.currentUser()?.photoUrl || '');
  editError = signal<string | null>(null);
  
  // Questionnaire
  questionnaire = signal<QuestionnaireData>({
    gestacao: null, roerUnhas: null, alergia: null, retirarCuticula: null, micose: null,
    medicamento: null, atividadeFisica: null, piscinaPraia: null, diabetes: null,
    unhaEncravada: null, laminaUngueal: [], outros: ''
  });
  
  readonly yesNoQuestions: { key: keyof QuestionnaireData; label: string }[] = [
      { key: 'gestacao', label: 'Está em período de gestação?' },
      { key: 'roerUnhas', label: 'Tem o hábito de roer as unhas?' },
      { key: 'alergia', label: 'Possui alergia a algum produto?' },
      { key: 'retirarCuticula', label: 'Gosta de retirar toda a cutícula?' },
      { key: 'micose', label: 'Possui algum tipo de micose?' },
      { key: 'medicamento', label: 'Faz uso de algum medicamento?' },
      { key: 'atividadeFisica', label: 'Pratica atividade física regularmente?' },
      { key: 'piscinaPraia', label: 'Frequenta piscina ou praia com frequência?' },
      { key: 'diabetes', label: 'É portadora de diabetes?' },
      { key: 'unhaEncravada', label: 'Possui unhas encravadas?' },
  ];
  readonly laminaUnguealOptions: ('descamacao' | 'descolamento' | 'manchas' | 'estrias')[] = ['descamacao', 'descolamento', 'manchas', 'estrias'];

  // Computed Data
  upcomingAppointments = computed<AppointmentDetails[]>(() => {
    const user = this.currentUser();
    if (!user) return [];
    const today = new Date().toISOString().split('T')[0];
    return this.dataService.appointments()
      .filter(a => a.userId === user.id && a.date >= today && a.status !== 'cancelled')
      .map(this.mapAppointmentDetails.bind(this))
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  });

  userAppointments = computed<AppointmentDetails[]>(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.dataService.appointments()
      .filter(a => a.userId === user.id)
      .map(this.mapAppointmentDetails.bind(this))
      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  });
  
  private mapAppointmentDetails(a: Appointment) {
    const service = this.services().find(s => s.id === a.serviceId);
    return {
      ...a,
      userName: this.currentUser()?.name || 'N/A',
      serviceName: service?.name || 'N/A',
      price: service?.price || 0,
      emoji: service?.emoji || '❓',
    };
  }

  // Methods
  toggleMenu() { this.isMenuOpen.update(v => !v); }
  logout() { this.authService.logout(); }
  selectSection(section: string) {
    this.activeSection.set(section);
    this.isMenuOpen.set(false);
    if(section === 'profile') {
      this.editingProfileData.set({ ...this.currentUser() });
      this.profilePicture.set(this.currentUser()?.photoUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${this.currentUser()?.name}`);
    }
  }

  // Booking
  bookAppointment() {
    const user = this.currentUser();
    if (!user || !this.selectedServiceId() || !this.appointmentDate() || !this.appointmentTime()) return;
    
    this.isSaving.set(true);
    
    const newAppt: Omit<Appointment, 'id'> = {
      userId: user.id,
      serviceId: this.selectedServiceId()!,
      date: this.appointmentDate(),
      time: this.appointmentTime(),
      status: 'pending',
      questionnaire: this.questionnaire()
    };
    
    setTimeout(() => { // Simulate async operation
      this.dataService.addAppointment(newAppt);
      this.isSaving.set(false);
      this.resetBookingForm();
      this.selectSection('dashboard');
    }, 1000);
  }

  resetBookingForm() {
    this.selectedServiceId.set(null);
    this.appointmentDate.set('');
    this.appointmentTime.set('');
    this.questionnaire.set({
        gestacao: null, roerUnhas: null, alergia: null, retirarCuticula: null, micose: null,
        medicamento: null, atividadeFisica: null, piscinaPraia: null, diabetes: null,
        unhaEncravada: null, laminaUngueal: [], outros: ''
    });
  }
  
  // Questionnaire Handlers
  updateQuestionnaireField(key: keyof QuestionnaireData, value: any) {
    this.questionnaire.update(q => ({ ...q, [key]: value }));
  }

  isLaminaUnguealSelected(option: string): boolean {
    return this.questionnaire().laminaUngueal.includes(option as any);
  }

  onLaminaUnguealChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const option = checkbox.value as 'descamacao' | 'descolamento' | 'manchas' | 'estrias';
    this.questionnaire.update(q => {
      const currentSelection = q.laminaUngueal;
      if (checkbox.checked) {
        return { ...q, laminaUngueal: [...currentSelection, option] };
      } else {
        return { ...q, laminaUngueal: currentSelection.filter(item => item !== option) };
      }
    });
  }
  
  onOutrosInputChange(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.updateQuestionnaireField('outros', value);
  }

  // Profile
  handleProfileFormChange(event: Event, field: 'name' | 'email' | 'newPassword') {
    const value = (event.target as HTMLInputElement).value;
    this.editingProfileData.update(data => ({ ...data, [field]: value }));
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.profilePicture.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  saveProfileChanges() {
    this.isSaving.set(true);
    this.editError.set(null);
    
    // Simple validation
    if (!this.editingProfileData().name || !this.editingProfileData().email) {
      this.editError.set('Nome e Email são obrigatórios.');
      this.isSaving.set(false);
      return;
    }
    
    setTimeout(() => { // Simulate async operation
        const updatedData = { ...this.currentUser(), ...this.editingProfileData(), photoUrl: this.profilePicture() } as User;
        delete (updatedData as any).newPassword;

        this.dataService.updateUser(updatedData);
        this.authService.currentUser.set(updatedData); // Update current user in auth service
        
        this.isSaving.set(false);
        this.selectSection('dashboard');
    }, 1000);
  }
}
