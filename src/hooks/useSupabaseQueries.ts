import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import {
  createCase,
  createClient,
  createDocumentMetadata,
  createEmployee,
  createNotification,
  createSession,
  deleteCaseRecord,
  deleteEmployeeRecord,
  deleteSessionRecord,
  fetchArchivedCases,
  fetchCases,
  fetchClients,
  fetchDocuments,
  fetchEmployees,
  fetchLawyers,
  fetchNotifications,
  fetchSessions,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
  restoreCaseRecord,
  toggleEmployeeStatusRecord,
  updateCaseRecord,
  updateClientRecord,
  updateEmployeeRecord,
  updateSessionRecord,
  uploadDocumentFile
} from '../lib/api';

export const queryKeys = {
  clients: ['clients'],
  cases: ['cases'],
  archivedCases: ['cases', 'archived'],
  employees: ['employees'],
  sessions: ['sessions'],
  documents: ['documents'],
  lawyers: ['lawyers'],
  notifications: ['notifications']
};

export function useClients(enabled = true) {
  return useQuery(queryKeys.clients, fetchClients, {
    enabled,
    staleTime: 60_000,
    cacheTime: 300_000,
    retry: 1
  });
}

export function useCases(enabled = true) {
  return useQuery(queryKeys.cases, fetchCases, {
    enabled,
    staleTime: 60_000,
    cacheTime: 300_000,
    retry: 1
  });
}

export function useArchivedCases(enabled = true) {
  return useQuery(queryKeys.archivedCases, fetchArchivedCases, {
    enabled,
    staleTime: 60_000,
    cacheTime: 300_000,
    retry: 1
  });
}

export function useEmployees(enabled = true) {
  return useQuery(queryKeys.employees, fetchEmployees, {
    enabled,
    staleTime: 60_000,
    cacheTime: 300_000,
    retry: 1
  });
}

export function useSessions(enabled = true) {
  return useQuery(queryKeys.sessions, fetchSessions, {
    enabled,
    staleTime: 60_000,
    cacheTime: 300_000,
    retry: 1
  });
}

export function useDocuments(enabled = true) {
  return useQuery(queryKeys.documents, fetchDocuments, {
    enabled,
    staleTime: 60_000,
    cacheTime: 300_000,
    retry: 1
  });
}

export function useLawyers(enabled = true) {
  return useQuery(queryKeys.lawyers, fetchLawyers, {
    enabled,
    staleTime: 60_000,
    cacheTime: 300_000,
    retry: 1
  });
}

export function useNotifications(enabled = true) {
  return useQuery(queryKeys.notifications, fetchNotifications, {
    enabled,
    staleTime: 30_000,
    cacheTime: 180_000,
    retry: 1
  });
}

export function useClientMutations() {
  const queryClient = useQueryClient();
  return {
    addClient: useMutation(createClient, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.clients)
    }),
    updateClient: useMutation(updateClientRecord, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.clients)
    })
  };
}

export function useCaseMutations() {
  const queryClient = useQueryClient();
  return {
    addCase: useMutation(createCase, {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.cases);
        queryClient.invalidateQueries(queryKeys.archivedCases);
      }
    }),
    updateCase: useMutation(updateCaseRecord, {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.cases);
        queryClient.invalidateQueries(queryKeys.archivedCases);
      }
    }),
    restoreCase: useMutation(restoreCaseRecord, {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.cases);
        queryClient.invalidateQueries(queryKeys.archivedCases);
      }
    }),
    deleteCase: useMutation(deleteCaseRecord, {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.cases);
        queryClient.invalidateQueries(queryKeys.archivedCases);
      }
    })
  };
}

export function useSessionMutations() {
  const queryClient = useQueryClient();
  return {
    createSession: useMutation(createSession, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.sessions)
    }),
    updateSession: useMutation(updateSessionRecord, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.sessions)
    }),
    deleteSession: useMutation(deleteSessionRecord, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.sessions)
    })
  };
}

export function useDocumentMutations() {
  const queryClient = useQueryClient();
  return {
    addDocument: useMutation(createDocumentMetadata, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.documents)
    }),
    uploadFile: useMutation(uploadDocumentFile, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.documents)
    })
  };
}

export function useEmployeeMutations() {
  const queryClient = useQueryClient();
  return {
    addEmployee: useMutation(createEmployee, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.employees)
    }),
    updateEmployee: useMutation(updateEmployeeRecord, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.employees)
    }),
    toggleEmployeeStatus: useMutation(toggleEmployeeStatusRecord, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.employees)
    }),
    deleteEmployee: useMutation(deleteEmployeeRecord, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.employees)
    })
  };
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  return {
    createNotification: useMutation(createNotification, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.notifications)
    }),
    markNotificationRead: useMutation(markNotificationReadApi, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.notifications)
    }),
    markAllNotificationsRead: useMutation(markAllNotificationsReadApi, {
      onSuccess: () => queryClient.invalidateQueries(queryKeys.notifications)
    })
  };
}

export function useRealtimeNotifications(onNewNotification: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        onNewNotification();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onNewNotification]);
}
