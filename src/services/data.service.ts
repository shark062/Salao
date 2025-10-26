import { Injectable, signal } from '@angular/core';
import { User, Service, Appointment, Feedback, Expense, Revenue } from '../models';

@Injectable({ providedIn: 'root' })
export class DataService {
  // Mock data signals
  users = signal<User[]>([
    { id: 1, name: 'Alice Silva', email: 'alice.silva@example.com', birthday: '1990-05-15', photoUrl: 'https://picsum.photos/id/1027/200/200' },
    { id: 2, name: 'Bruno Costa', email: 'bruno.costa@example.com', birthday: '1988-11-20' },
    { id: 3, name: 'Carla Dias', email: 'carla.dias@example.com', birthday: '1995-02-10', photoUrl: 'https://picsum.photos/id/1028/200/200' }
  ]);

  services = signal<Service[]>([
    { id: 1, name: 'Manicure Tradicional', description: 'Cutilagem e esmaltação tradicional.', price: 30, duration: 45, category: 'Mãos', emoji: '💅' },
    { id: 2, name: 'Pedicure Tradicional', description: 'Cutilagem e esmaltação tradicional.', price: 35, duration: 50, category: 'Pés', emoji: '👣' },
    { id: 3, name: 'Alongamento em Fibra de Vidro', description: 'Aplicação de fibra de vidro para unhas mais longas e resistentes.', price: 180, duration: 150, category: 'Alongamento', emoji: '✨' },
    { id: 4, name: 'Esmaltação em Gel', description: 'Esmalte com secagem em cabine UV, maior durabilidade.', price: 70, duration: 60, category: 'Mãos', emoji: '💖' },
    { id: 5, name: 'Spa dos Pés', description: 'Tratamento completo de hidratação e relaxamento para os pés.', price: 90, duration: 75, category: 'Pés', emoji: '🛀' }
  ]);

  appointments = signal<Appointment[]>([
    { id: 1, userId: 1, serviceId: 1, date: '2024-07-28', time: '10:00', status: 'confirmed' },
    { id: 2, userId: 2, serviceId: 3, date: '2024-07-29', time: '14:00', status: 'pending' },
    { id: 3, userId: 1, serviceId: 4, date: '2024-08-05', time: '11:30', status: 'confirmed' },
    { id: 4, userId: 3, serviceId: 2, date: '2024-08-05', time: '16:00', status: 'cancelled' },
  ]);

  feedback = signal<Feedback[]>([
    { id: 1, rating: 5, comment: 'Serviço impecável, como sempre!', date: '2024-07-28', userName: 'Alice Silva', userId: 1 },
    { id: 2, rating: 4, comment: 'Gostei muito do resultado, mas a cor não era exatamente o que eu esperava.', date: '2024-07-20' },
  ]);

  expenses = signal<Expense[]>([
    { id: 1, item: 'Esmaltes (lote)', category: 'supplies', amount: 250.00, date: '2024-07-01' },
    { id: 2, item: 'Aluguel do espaço', category: 'rent', amount: 1500.00, date: '2024-07-05' },
    { id: 3, item: 'Conta de luz', category: 'utilities', amount: 180.50, date: '2024-07-10' },
  ]);

  revenues = signal<Revenue[]>([
    { id: 1, item: 'Venda de creme para mãos', category: 'product_sale', amount: 45.00, date: '2024-07-15' },
    { id: 2, item: 'Curso de Manicure Básico', category: 'course', amount: 800.00, date: '2024-07-20' },
  ]);

  // Methods to interact with data
  addAppointment(appointment: Omit<Appointment, 'id'>) {
    this.appointments.update(appointments => [
      ...appointments,
      { ...appointment, id: Math.max(...appointments.map(a => a.id), 0) + 1 }
    ]);
  }

  updateAppointmentStatus(appointmentId: number, status: 'confirmed' | 'pending' | 'cancelled') {
    this.appointments.update(appointments => appointments.map(appt => 
        appt.id === appointmentId ? { ...appt, status } : appt
    ));
  }

  addUser(user: Omit<User, 'id'>) {
    const newUser = { ...user, id: Math.max(...this.users().map(u => u.id), 0) + 1 };
    this.users.update(users => [...users, newUser]);
  }

  updateUser(updatedUser: User) {
    this.users.update(users => users.map(user => user.id === updatedUser.id ? updatedUser : user));
  }

  deleteUser(userId: number) {
    this.users.update(users => users.filter(user => user.id !== userId));
    this.appointments.update(appointments => appointments.filter(appt => appt.userId !== userId));
  }
  
  addService(service: Omit<Service, 'id'>) {
    const newService = { ...service, id: Math.max(...this.services().map(s => s.id), 0) + 1 };
    this.services.update(services => [...services, newService]);
  }

  updateService(updatedService: Service) {
    this.services.update(services => services.map(s => s.id === updatedService.id ? updatedService : s));
  }

  deleteService(serviceId: number) {
    this.services.update(services => services.filter(service => service.id !== serviceId));
  }

  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense = { ...expense, id: Math.max(...this.expenses().map(e => e.id), 0) + 1 };
    this.expenses.update(expenses => [...expenses, newExpense]);
  }

  deleteExpense(expenseId: number) {
    this.expenses.update(expenses => expenses.filter(e => e.id !== expenseId));
  }

  addRevenue(revenue: Omit<Revenue, 'id'>) {
    const newRevenue = { ...revenue, id: Math.max(...this.revenues().map(r => r.id), 0) + 1 };
    this.revenues.update(revenues => [...revenues, newRevenue]);
  }

  deleteRevenue(revenueId: number) {
    this.revenues.update(revenues => revenues.filter(r => r.id !== revenueId));
  }
  
  addFeedback(feedback: Omit<Feedback, 'id'>) {
    this.feedback.update(feedbacks => [
        ...feedbacks,
        { ...feedback, id: Math.max(...feedbacks.map(f => f.id), 0) + 1 }
    ]);
  }
}
