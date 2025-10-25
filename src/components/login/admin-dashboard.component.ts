import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { LogService } from '../../services/log.service';
import { ExportService } from '../../services/export.service';
import { AppointmentDetails, Service, User, Appointment, Expense, Revenue } from '../../models';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

type AdminSection = 'dashboard' | 'appointments' | 'services' | 'finances' | 'clients';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);
  logService = inject(LogService);
  exportService = inject(ExportService);

  activeSection = signal<AdminSection>('dashboard');
  isMenuOpen = signal(false);
  isSaving = signal(false);
  
  // Service Modal
  selectedServiceForModal = signal<Service | null>(null);
  isEditMode = signal(false);
  editingServiceData = signal<Service | null>(null);

  // Appointment Modal
  selectedAppointmentForModal = signal<AppointmentDetails | null>(null);
  editingAppointmentData = signal<AppointmentDetails | null>(null);

  // Client Modal
  selectedClientForModal = signal<User | null>(null);
  editingClientData = signal<User | null>(null);

  // Expense Modal
  isAddExpenseModalOpen = signal(false);
  newExpenseData = signal<Omit<Expense, 'id'>>({ item: '', category: 'supplies', amount: 0, date: new Date().toISOString().split('T')[0] });

  // Revenue Modal
  isAddRevenueModalOpen = signal(false);
  newRevenueData = signal<Omit<Revenue, 'id'>>({ item: '', category: 'product_sale', amount: 0, date: new Date().toISOString().split('T')[0] });
  
  appointmentsWithDetails = computed(() => {
    return this.dataService.appointments()
      .map(app => this.dataService.getAppointmentDetails(app))
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  services = this.dataService.services;
  clients = this.dataService.users;

  // Stats
  todayBookings = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.dataService.appointments().filter(a => a.date === today).length;
  });

  todayRevenue = computed(() => {
      const today = new Date().toISOString().split('T')[0];
      const todayApps = this.dataService.appointments().filter(a => a.date === today && a.status === 'confirmed');
      return todayApps.reduce((total, app) => {
          const service = this.dataService.services().find(s => s.id === app.serviceId);
          return total + (service?.price || 0);
      }, 0);
  });

  monthlyBookings = computed(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return this.dataService.appointments().filter(a => {
        const appDate = new Date(a.date);
        return appDate.getFullYear() === year && appDate.getMonth() === month;
    }).length;
  });

  monthlyRevenue = computed(() => {
      const today = new Date();
      return this.dataService.getRevenueForMonth(today.getFullYear(), today.getMonth() + 1);
  });

  yearlyRevenue = computed(() => {
    const today = new Date();
    return this.dataService.getRevenueForYear(today.getFullYear());
  });

  totalClients = computed(() => this.dataService.users().length);
  totalBookings = computed(() => this.dataService.appointments().length);

  monthlyExpenses = computed(() => {
    const today = new Date();
    return this.dataService.getExpensesForMonth(today.getFullYear(), today.getMonth() + 1);
  });
  monthlyProfit = computed(() => this.monthlyRevenue() - this.monthlyExpenses());

  clientsWithBirthdayToday = computed(() => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();
    
    return this.clients().filter(client => {
        const [_year, month, day] = client.birthday.split('-').map(Number);
        return month === todayMonth && day === todayDate;
    });
  });

  currentMonthExpenses = computed(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return this.dataService.expenses().filter(exp => {
        const [expYear, expMonth] = exp.date.split('-').map(Number);
        return expYear === year && expMonth === month;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  currentMonthRevenues = computed(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return this.dataService.revenues().filter(rev => {
        const [revYear, revMonth] = rev.date.split('-').map(Number);
        return revYear === year && revMonth === month;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  selectSection(section: AdminSection) {
    this.activeSection.set(section);
    this.isMenuOpen.set(false);
  }

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  sendBirthdayGreeting(client: User) {
    const message = `Olá, ${client.name}! 🎂 Feliz aniversário! A equipe do Erides Souza Estúdio deseja a você um dia maravilhoso, cheio de alegria e beleza. Esperamos vê-la em breve para celebrar! ✨`;
    alert(message);
    this.logService.log('Birthday Greeting Sent', { clientId: client.id, clientName: client.name });
  }

  // Service Methods
  openServiceModal(service: Service) {
    this.selectedServiceForModal.set(service);
    this.isEditMode.set(false);
  }

  openNewServiceModal() {
    const newService: Service = {
      id: 0, // 0 indicates a new service
      name: '',
      description: '',
      price: 0,
      duration: 30,
      category: 'Mãos',
      emoji: '✨'
    };
    this.editingServiceData.set(newService);
    this.selectedServiceForModal.set(newService); // To open the modal
    this.isEditMode.set(true); // Go directly to the form
  }

  closeServiceModal() {
    this.selectedServiceForModal.set(null);
    this.isEditMode.set(false);
    this.editingServiceData.set(null);
  }

  switchToEditMode() {
    if (this.selectedServiceForModal()) {
      this.editingServiceData.set({ ...this.selectedServiceForModal()! });
      this.isEditMode.set(true);
    }
  }

  cancelEdit() {
    // If it was a new service, close the modal completely
    if (this.editingServiceData()?.id === 0) {
      this.closeServiceModal();
    } else {
      this.isEditMode.set(false);
      this.editingServiceData.set(null);
    }
  }

  saveService() {
    const serviceData = this.editingServiceData();
    if (serviceData && !this.isSaving()) {
      this.isSaving.set(true);
      setTimeout(() => {
        try {
          if (serviceData.id) { // Existing service
            this.dataService.updateService(serviceData);
            this.logService.log('Service Updated', { serviceId: serviceData.id, serviceName: serviceData.name });
          } else { // New service
            const { id, ...newServiceData } = serviceData;
            this.dataService.addService(newServiceData);
            this.logService.log('Service Created', { serviceName: serviceData.name });
          }
          this.closeServiceModal();
        } finally {
          this.isSaving.set(false);
        }
      }, 500);
    }
  }

  deleteService(serviceToDelete: Service) {
    const confirmation = confirm(`Tem certeza que deseja excluir o serviço "${serviceToDelete.name}"? Esta ação não pode ser desfeita.`);
    if (confirmation) {
        this.dataService.deleteService(serviceToDelete.id);
        this.logService.log('Service Deleted', { serviceId: serviceToDelete.id, serviceName: serviceToDelete.name });
        this.closeServiceModal();
    }
  }

  handleFormChange(event: Event, field: keyof Service) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    this.editingServiceData.update(currentService => {
      if (!currentService) return null;
      const updatedValue = (field === 'price' || field === 'duration') ? Number(value) : value;
      return { ...currentService, [field]: updatedValue };
    });
  }

  // Appointment Methods
  openAppointmentModal(appointment: AppointmentDetails) {
    this.selectedAppointmentForModal.set(appointment);
    this.editingAppointmentData.set({ ...appointment });
  }

  closeAppointmentModal() {
    this.selectedAppointmentForModal.set(null);
    this.editingAppointmentData.set(null);
  }

  saveAppointmentChanges() {
    const updatedData = this.editingAppointmentData();
    if (updatedData && !this.isSaving()) {
      this.isSaving.set(true);
      setTimeout(() => {
        try {
          const { userName, serviceName, price, emoji, ...appointmentToSave } = updatedData;
          this.dataService.updateAppointment(appointmentToSave);
          this.logService.log('Appointment Updated', { appointmentId: appointmentToSave.id });
          this.closeAppointmentModal();
        } finally {
          this.isSaving.set(false);
        }
      }, 500);
    }
  }

  handleAppointmentFormChange(event: Event, field: keyof Appointment) {
    const { value } = event.target as HTMLInputElement | HTMLSelectElement;
    this.editingAppointmentData.update(d => d ? { ...d, [field]: value } : null);
  }

  // Client Methods
  openClientModal(client: User) {
    this.selectedClientForModal.set(client);
    this.editingClientData.set({ ...client });
  }

  closeClientModal() {
    this.selectedClientForModal.set(null);
    this.editingClientData.set(null);
  }

  saveClientChanges() {
    const updatedUser = this.editingClientData();
    if (updatedUser && !this.isSaving()) {
      this.isSaving.set(true);
      setTimeout(() => {
        try {
          this.dataService.updateUser(updatedUser);
          this.logService.log('Client Updated', { userId: updatedUser.id });
          this.closeClientModal();
        } finally {
          this.isSaving.set(false);
        }
      }, 500);
    }
  }

  handleClientFormChange(event: Event, field: keyof User) {
    const input = event.target as HTMLInputElement;
    const value = field === 'isLoyal' ? input.checked : input.value;
    this.editingClientData.update(d => d ? { ...d, [field]: value } : null);
  }

  // Finance Methods
  openAddExpenseModal() {
    this.newExpenseData.set({ item: '', category: 'supplies', amount: 0, date: new Date().toISOString().split('T')[0] });
    this.isAddExpenseModalOpen.set(true);
  }
  closeAddExpenseModal() { this.isAddExpenseModalOpen.set(false); }

  openAddRevenueModal() {
    this.newRevenueData.set({ item: '', category: 'product_sale', amount: 0, date: new Date().toISOString().split('T')[0] });
    this.isAddRevenueModalOpen.set(true);
  }
  closeAddRevenueModal() { this.isAddRevenueModalOpen.set(false); }

  handleFinanceFormChange(event: Event, type: 'expense' | 'revenue', field: keyof Omit<Expense, 'id'> | keyof Omit<Revenue, 'id'>) {
    const { value } = event.target as HTMLInputElement;
    const dataSignal = type === 'expense' ? this.newExpenseData : this.newRevenueData;
    dataSignal.update(d => ({ ...d, [field]: field === 'amount' ? Number(value) : value }));
  }

  saveNewExpense() {
    if (this.isSaving() || !this.newExpenseData().item || this.newExpenseData().amount <= 0) return;
    this.isSaving.set(true);
    setTimeout(() => {
      try {
        this.dataService.addExpense(this.newExpenseData());
        this.logService.log('Expense Added', { item: this.newExpenseData().item });
        this.closeAddExpenseModal();
      } finally {
        this.isSaving.set(false);
      }
    }, 500);
  }

  saveNewRevenue() {
    if (this.isSaving() || !this.newRevenueData().item || this.newRevenueData().amount <= 0) return;
    this.isSaving.set(true);
    setTimeout(() => {
      try {
        this.dataService.addRevenue(this.newRevenueData());
        this.logService.log('Revenue Added', { item: this.newRevenueData().item });
        this.closeAddRevenueModal();
      } finally {
        this.isSaving.set(false);
      }
    }, 500);
  }


  // Export Methods
  exportAppointments() {
    this.logService.log('Export Appointments Requested');
    this.exportService.exportToCsv(this.appointmentsWithDetails(), 'agendamentos_erides_souza.csv');
  }

  exportClients() {
    this.logService.log('Export Clients Requested');
    this.exportService.exportToCsv(this.clients(), 'clientes_erides_souza.csv');
  }

  logout() {
    this.authService.logout();
  }
}