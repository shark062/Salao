import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Appointment, AppointmentDetails, User, Service, Expense, Revenue } from '../../models';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, ThemeToggleComponent, FormsModule],
  templateUrl: '../admin/admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);
  currentUser = this.authService.currentUser;

  // State
  isMenuOpen = signal(false);
  activeSection = signal('dashboard');
  
  isEditClientModalOpen = signal(false);
  editingClient = signal<User | null>(null);

  isAddClientModalOpen = signal(false);
  newClientData = signal({ name: '', email: '', birthday: '' });

  isDeleteConfirmationOpen = signal(false);
  itemToDelete = signal<{ type: string, id: number, name: string } | null>(null);

  clientSearchTerm = signal('');

  // Service Management
  isAddServiceModalOpen = signal(false);
  isEditServiceModalOpen = signal(false);
  newService = signal<Omit<Service, 'id'>>({ name: '', description: '', price: 0, duration: 0, category: '', emoji: '' });
  editingService = signal<Service | null>(null);

  // Financials Management
  isAddExpenseModalOpen = signal(false);
  isAddRevenueModalOpen = signal(false);
  newExpense = signal<Omit<Expense, 'id'>>({ item: '', category: 'other', amount: 0, date: new Date().toISOString().split('T')[0] });
  newRevenue = signal<Omit<Revenue, 'id'>>({ item: '', category: 'other', amount: 0, date: new Date().toISOString().split('T')[0] });

  // Computed Data
  appointments = this.dataService.appointments;
  users = this.dataService.users;
  services = this.dataService.services;
  feedback = this.dataService.feedback;
  expenses = this.dataService.expenses;
  revenues = this.dataService.revenues;

  totalRevenue = computed(() => this.revenues().reduce((acc, r) => acc + r.amount, 0));
  totalExpenses = computed(() => this.expenses().reduce((acc, e) => acc + e.amount, 0));
  netIncome = computed(() => this.totalRevenue() - this.totalExpenses());
  
  upcomingAppointments = computed<AppointmentDetails[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments()
      .filter(a => a.date >= today)
      .map(this.mapAppointmentDetails.bind(this))
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  });
  
  allAppointments = computed<AppointmentDetails[]>(() => {
      return this.appointments()
        .map(this.mapAppointmentDetails.bind(this))
        .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  });

  private mapAppointmentDetails(a: Appointment) {
    const user = this.users().find(u => u.id === a.userId);
    const service = this.services().find(s => s.id === a.serviceId);
    return {
      ...a,
      userName: user?.name || 'N/A',
      serviceName: service?.name || 'N/A',
      price: service?.price || 0,
      emoji: service?.emoji || '❓',
    };
  }
  
  clientsWithAppointmentCount = computed(() => {
    return this.users().map(user => {
      const count = this.appointments().filter(a => a.userId === user.id && a.status === 'confirmed').length;
      return { ...user, appointmentCount: count };
    }).sort((a,b) => b.appointmentCount - a.appointmentCount);
  });
  
  topLoyalClients = computed(() => this.clientsWithAppointmentCount().slice(0, 5));
  
  filteredClients = computed(() => {
    const term = this.clientSearchTerm().toLowerCase();
    if (!term) return this.clientsWithAppointmentCount();
    return this.clientsWithAppointmentCount().filter(c => 
      c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
    );
  });

  // Methods
  toggleMenu() { this.isMenuOpen.update(v => !v); }
  selectSection(section: string) {
    this.activeSection.set(section);
    this.isMenuOpen.set(false);
  }
  logout() { this.authService.logout(); }

  // Client Modals
  openEditClientModal(client: User) {
    this.editingClient.set({ ...client });
    this.isEditClientModalOpen.set(true);
  }
  closeEditClientModal() { this.isEditClientModalOpen.set(false); this.editingClient.set(null); }
  
  openAddClientModal() { this.isAddClientModalOpen.set(true); }
  closeAddClientModal() { this.isAddClientModalOpen.set(false); this.newClientData.set({ name: '', email: '', birthday: '' }); }

  handleNewClientFormChange(event: Event) {
    const { name, value } = event.target as HTMLInputElement;
    this.newClientData.update(data => ({ ...data, [name]: value }));
  }

  handleEditClientFormChange(event: Event) {
    const { name, value } = event.target as HTMLInputElement;
    this.editingClient.update(client => client ? { ...client, [name]: value } : null);
  }
  
  saveClientChanges() {
    const client = this.editingClient();
    if (client) {
      this.dataService.updateUser(client);
      this.closeEditClientModal();
    }
  }

  saveNewClient() {
    this.dataService.addUser(this.newClientData());
    this.closeAddClientModal();
  }

  // Delete Confirmation
  openDeleteConfirmation(type: string, id: number, name: string) {
    this.itemToDelete.set({ type, id, name });
    this.isDeleteConfirmationOpen.set(true);
  }
  closeDeleteConfirmation() { this.isDeleteConfirmationOpen.set(false); this.itemToDelete.set(null); }

  confirmDelete() {
    const item = this.itemToDelete();
    if (!item) return;
    
    switch (item.type) {
      case 'client': this.dataService.deleteUser(item.id); break;
      case 'service': this.dataService.deleteService(item.id); break;
      case 'expense': this.dataService.deleteExpense(item.id); break;
      case 'revenue': this.dataService.deleteRevenue(item.id); break;
    }
    
    this.closeDeleteConfirmation();
  }

  // Service Modals
  openAddServiceModal() { this.isAddServiceModalOpen.set(true); }
  closeAddServiceModal() { this.isAddServiceModalOpen.set(false); this.newService.set({ name: '', description: '', price: 0, duration: 0, category: '', emoji: '' }); }
  
  openEditServiceModal(service: Service) {
    this.editingService.set({ ...service });
    this.isEditServiceModalOpen.set(true);
  }
  closeEditServiceModal() { this.isEditServiceModalOpen.set(false); this.editingService.set(null); }
  
  saveNewService() { this.dataService.addService(this.newService()); this.closeAddServiceModal(); }
  saveServiceChanges() { if (this.editingService()) { this.dataService.updateService(this.editingService()!); this.closeEditServiceModal(); } }
  
  handleNewServiceChange(field: keyof Service, value: any) { this.newService.update(s => ({ ...s, [field]: value })); }
  handleEditServiceChange(field: keyof Service, value: any) { this.editingService.update(s => s ? { ...s, [field]: value } : null); }

  // Financial Modals
  openAddExpenseModal() { this.isAddExpenseModalOpen.set(true); }
  closeAddExpenseModal() { this.isAddExpenseModalOpen.set(false); this.newExpense.set({ item: '', category: 'other', amount: 0, date: new Date().toISOString().split('T')[0] }); }
  saveNewExpense() { this.dataService.addExpense(this.newExpense()); this.closeAddExpenseModal(); }
  handleNewExpenseChange(field: keyof Expense, value: any) { this.newExpense.update(e => ({ ...e, [field]: value })); }

  openAddRevenueModal() { this.isAddRevenueModalOpen.set(true); }
  closeAddRevenueModal() { this.isAddRevenueModalOpen.set(false); this.newRevenue.set({ item: '', category: 'other', amount: 0, date: new Date().toISOString().split('T')[0] }); }
  saveNewRevenue() { this.dataService.addRevenue(this.newRevenue()); this.closeAddRevenueModal(); }
  handleNewRevenueChange(field: keyof Revenue, value: any) { this.newRevenue.update(r => ({ ...r, [field]: value })); }

  updateAppointmentStatus(id: number, event: Event) {
    const status = (event.target as HTMLSelectElement).value as 'confirmed' | 'pending' | 'cancelled';
    this.dataService.updateAppointmentStatus(id, status);
  }
}
