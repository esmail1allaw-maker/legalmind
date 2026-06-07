export type PageId =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot'
  | 'dashboard'
  | 'clients'
  | 'cases'
  | 'sessions'
  | 'documents'
  | 'lawyers'
  | 'subscription'
  | 'profile'
  | 'settings'
  | 'reports'
  | 'help'
  | 'notifications';

export type UserRole = 'admin' | 'firm_manager' | 'lawyer' | 'consultant';
export type CustomerType = 'شركة تجارية' | 'فرد';
export type NotificationType = 'session' | 'document' | 'case';
export type AlertType = 'success' | 'error' | 'info';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  company: string;
  phone: string;
  licenseNo: string;
  image?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: CustomerType;
  casesCount: number;
  createdAt: string;
}

export interface CaseRecord {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  category: string;
  status: string;
  court: string;
  caseNo: string;
  lawyerId: string;
  dateStarted: string;
  description: string;
}

export interface SessionItem {
  id: string;
  caseId: string;
  caseTitle: string;
  court: string;
  date: string;
  time: string;
  status: string;
  type: string;
  notes: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  caseId: string;
  caseTitle: string;
  category: string;
  size: string;
  dateUploaded: string;
  url: string;
}

export interface Lawyer {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  specialization: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  color: string;
  badge?: string;
}

export interface ChartPoint {
  month: string;
  cases: number;
  resolved: number;
  revenue: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
}

export interface AlertState {
  type: AlertType;
  text: string;
}
