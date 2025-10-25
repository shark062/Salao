import { Injectable, signal } from '@angular/core';
import { User, Service, Appointment, Expense, AppointmentDetails, QuestionnaireData, Revenue } from '../models';

@Injectable({ providedIn: 'root' })
export class DataService {
  users = signal<User[]>([
    { id: 1, name: 'Ana Clara', email: 'ana.clara@email.com', isLoyal: true, birthday: '1995-08-15', photoUrl: 'https://picsum.photos/id/1027/200/200' },
    { id: 2, name: 'Beatriz Costa', email: 'beatriz.costa@email.com', isLoyal: false, birthday: '2000-03-22' },
    { id: 3, name: 'Carla Dias', email: 'carla.dias@email.com', isLoyal: true, birthday: '1998-11-05' },
  ]);

  services = signal<Service[]>([
    { id: 1, name: 'Manicure Essencial', description: 'Cutilagem, lixamento e esmaltação com cores nacionais.', price: 30, duration: 45, category: 'Mãos', emoji: '💅' },
    { id: 2, name: 'Pedicure Relax', description: 'Tratamento completo para os pés com esfoliação e massagem.', price: 40, duration: 60, category: 'Pés', emoji: '👣' },
    { id: 3, name: 'Unha de Gel', description: 'Aplicação de unhas de gel com aspecto natural e alta durabilidade.', price: 120, duration: 120, category: 'Alongamento', emoji: '💎' },
    { id: 4, name: 'Spa das Mãos', description: 'Hidratação profunda, esfoliação e tratamento para cutículas.', price: 50, duration: 60, category: 'Tratamento', emoji: '✨' },
    { id: 5, name: 'Esmaltação em Gel', description: 'Esmalte de longa duração com secagem imediata e brilho intenso.', price: 60, duration: 75, category: 'Mãos', emoji: '💖' },
    { id: 6, name: 'Manutenção Gel', description: 'Manutenção das unhas de gel para garantir a durabilidade.', price: 80, duration: 90, category: 'Alongamento', emoji: '🔧' },
  ]);

  appointments = signal<Appointment[]>([
    { id: 1, userId: 1, serviceId: 1, date: '2024-07-28', time: '10:00', status: 'confirmed' },
    { id: 2, userId: 2, serviceId: 3, date: '2024-07-29', time: '14:00', status: 'confirmed' },
    { id: 3, userId: 1, serviceId: 2, date: new Date().toISOString().split('T')[0], time: '11:00', status: 'confirmed' },
  ]);

  expenses = signal<Expense[]>([
    { id: 1, item: 'Aluguel do Espaço', category: 'rent', amount: 1500, date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01` },
    { id: 2, item: 'Esmaltes e Acetona', category: 'supplies', amount: 350, date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-05` },
    { id: 3, item: 'Energia Elétrica', category: 'utilities', amount: 250, date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10` },
  ]);
  
  revenues = signal<Revenue[]>([]);

  getAppointmentDetails(app: Appointment): AppointmentDetails {
    const user = this.users().find(u => u.id === app.userId);
    const service = this.services().find(s => s.id === app.serviceId);
    return {
      ...app,
      userName: user?.name || 'Desconhecido',
      serviceName: service?.name || 'Desconhecido',
      price: service?.price || 0,
      emoji: service?.emoji || '❔',
    };
  }
  
  addAppointment(data: { userId: number; serviceId: number; date: string; time: string; questionnaire: QuestionnaireData; }): void {
    this.appointments.update(apps => {
      const newId = Math.max(0, ...apps.map(a => a.id)) + 1;
      const newAppointment: Appointment = {
        id: newId,
        status: 'confirmed',
        userId: data.userId,
        serviceId: data.serviceId,
        date: data.date,
        time: data.time,
        questionnaire: data.questionnaire
      };
      return [...apps, newAppointment];
    });
  }

  addService(serviceData: Omit<Service, 'id'>): void {
    this.services.update(services => {
      const newId = Math.max(0, ...services.map(s => s.id)) + 1;
      const newService: Service = { id: newId, ...serviceData };
      return [...services, newService];
    });
  }

  deleteService(serviceId: number): void {
    this.services.update(services => services.filter(s => s.id !== serviceId));
  }

  updateService(updatedService: Service): void {
    this.services.update(services => 
      services.map(s => s.id === updatedService.id ? updatedService : s)
    );
  }

  updateAppointment(updatedAppointment: Appointment): void {
    this.appointments.update(apps => 
      apps.map(a => a.id === updatedAppointment.id ? updatedAppointment : a)
    );
  }

  updateUser(updatedUser: User): void {
    this.users.update(users => 
      users.map(u => u.id === updatedUser.id ? updatedUser : u)
    );
  }

  addExpense(expenseData: Omit<Expense, 'id'>): void {
    this.expenses.update(expenses => {
      const newId = Math.max(0, ...expenses.map(e => e.id)) + 1;
      const newExpense: Expense = { id: newId, ...expenseData };
      return [...expenses, newExpense];
    });
  }

  addRevenue(revenueData: Omit<Revenue, 'id'>): void {
    this.revenues.update(revenues => {
      const newId = Math.max(0, ...revenues.map(r => r.id)) + 1;
      const newRevenue: Revenue = { id: newId, ...revenueData };
      return [...revenues, newRevenue];
    });
  }

  getRevenueForMonth(year: number, month: number): number {
    const appointmentRevenue = this.appointments().reduce((total, app) => {
      const appDate = new Date(app.date);
      if (appDate.getFullYear() === year && appDate.getMonth() + 1 === month && app.status === 'confirmed') {
        const service = this.services().find(s => s.id === app.serviceId);
        return total + (service?.price || 0);
      }
      return total;
    }, 0);

    const manualRevenue = this.revenues().reduce((total, rev) => {
      const [revYear, revMonth] = rev.date.split('-').map(Number);
      if (revYear === year && revMonth === month) {
        return total + rev.amount;
      }
      return total;
    }, 0);

    return appointmentRevenue + manualRevenue;
  }

  getExpensesForMonth(year: number, month: number): number {
    return this.expenses().reduce((total, exp) => {
      const [expYear, expMonth] = exp.date.split('-').map(Number);
      if (expYear === year && expMonth === month) {
        return total + exp.amount;
      }
      return total;
    }, 0);
  }
  
  getRevenueForYear(year: number): number {
    return this.appointments().reduce((total, app) => {
      const appDate = new Date(app.date);
      if (appDate.getFullYear() === year && app.status === 'confirmed') {
        const service = this.services().find(s => s.id === app.serviceId);
        return total + (service?.price || 0);
      }
      return total;
    }, 0);
  }
}