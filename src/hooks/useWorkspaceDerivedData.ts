import { useMemo } from 'react';
import type { CaseRecord, Client, DocumentItem, Lawyer, PageId, SessionItem, User } from '../types/app';
import {
  buildFinancialSummary,
  buildMonthlyChartData,
  buildPerformanceMetrics,
  buildStatHints
} from '../lib/dashboardAnalytics';
import { isFirmManagerRole } from '../lib/roleAccess';

interface UseWorkspaceDerivedDataInput {
  isAuth: boolean;
  currentPage: PageId;
  user: User | null;
  clients: Client[];
  cases: CaseRecord[];
  sessions: SessionItem[];
  documents: DocumentItem[];
  lawyers: Lawyer[];
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  clientsLoading: boolean;
  casesLoading: boolean;
  employeesLoading: boolean;
  sessionsLoading: boolean;
  documentsLoading: boolean;
  lawyersLoading: boolean;
}

export function useWorkspaceDerivedData(input: UseWorkspaceDerivedDataInput) {
  const {
    isAuth,
    currentPage,
    user,
    clients,
    cases,
    sessions,
    documents,
    lawyers,
    searchQuery,
    statusFilter,
    categoryFilter,
    clientsLoading,
    casesLoading,
    employeesLoading,
    sessionsLoading,
    documentsLoading,
    lawyersLoading
  } = input;

  const filteredCases = useMemo(() => cases.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = item.title.toLowerCase().includes(q) || item.clientName.toLowerCase().includes(q) || item.caseNo.includes(q);
    const matchStatus = statusFilter === 'الكل' || item.status === statusFilter;
    const matchCategory = categoryFilter === 'الكل' || item.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  }), [cases, searchQuery, statusFilter, categoryFilter]);

  const filteredClients = useMemo(() => clients.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  }), [clients, searchQuery]);

  const stats = useMemo(() => ({
    totalClients: clients.length,
    totalCases: cases.length,
    activeCases: cases.filter((c) => c.status === 'active').length,
    upcomingSessions: sessions.filter((s) => s.status === 'مجدولة').length,
    totalDocuments: documents.length,
    lawyersCount: lawyers.length
  }), [clients.length, cases, sessions, documents.length, lawyers.length]);

  const monthlyData = useMemo(() => buildMonthlyChartData(cases), [cases]);
  const dashboardPerformance = useMemo(() => buildPerformanceMetrics(cases, sessions), [cases, sessions]);
  const dashboardFinancials = useMemo(() => buildFinancialSummary(cases), [cases]);
  const dashboardStatHints = useMemo(
    () => buildStatHints(cases, clients, sessions, documents),
    [cases, clients, sessions, documents]
  );

  const pageLoading = useMemo(() => {
    if (!isAuth) return false;
    switch (currentPage) {
      case 'dashboard':
        return (
          clientsLoading ||
          casesLoading ||
          employeesLoading ||
          sessionsLoading ||
          documentsLoading ||
          lawyersLoading
        );
      case 'clients':
        return clientsLoading;
      case 'execution':
        return clientsLoading || casesLoading;
      case 'cases':
        return casesLoading;
      case 'archive':
        return casesLoading;
      case 'employees':
        return employeesLoading || (Boolean(user && isFirmManagerRole(user.role)) && (casesLoading || lawyersLoading));
      case 'sessions':
        return sessionsLoading;
      case 'documents':
        return documentsLoading;
      case 'lawyers':
        return lawyersLoading;
      case 'reports':
        return casesLoading;
      default:
        return false;
    }
  }, [
    isAuth,
    currentPage,
    clientsLoading,
    casesLoading,
    employeesLoading,
    sessionsLoading,
    documentsLoading,
    lawyersLoading,
    user
  ]);

  return {
    filteredCases,
    filteredClients,
    stats,
    monthlyData,
    dashboardPerformance,
    dashboardFinancials,
    dashboardStatHints,
    pageLoading
  };
}
