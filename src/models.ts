export interface User {
  id: number;
  name: string;
  email: string;
  isLoyal: boolean;
  birthday: string; // YYYY-MM-DD
  photoUrl?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  emoji: string;
}

export interface QuestionnaireData {
  gestacao: 'sim' | 'nao' | null;
  roerUnhas: 'sim' | 'nao' | null;
  alergia: 'sim' | 'nao' | null;
  retirarCuticula: 'sim' | 'nao' | null;
  micose: 'sim' | 'nao' | null;
  medicamento: 'sim' | 'nao' | null;
  atividadeFisica: 'sim' | 'nao' | null;
  piscinaPraia: 'sim' | 'nao' | null;
  diabetes: 'sim' | 'nao' | null;
  unhaEncravada: 'sim' | 'nao' | null;
  laminaUngueal: ('descamacao' | 'descolamento' | 'manchas' | 'estrias')[];
  outros: string;
}


export interface Appointment {
  id: number;
  userId: number;
  serviceId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'confirmed' | 'pending' | 'cancelled';
  questionnaire?: QuestionnaireData;
}

export interface Expense {
    id: number;
    item: string;
    category: 'supplies' | 'rent' | 'utilities' | 'marketing' | 'other';
    amount: number;
    date: string; // YYYY-MM-DD
}

export interface Revenue {
    id: number;
    item: string;
    category: 'product_sale' | 'course' | 'other';
    amount: number;
    date: string; // YYYY-MM-DD
}

export interface AppointmentDetails extends Appointment {
    userName: string;
    serviceName: string;
    price: number;
    emoji: string;
}