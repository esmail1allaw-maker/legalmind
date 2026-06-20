import type { PageId, UserRole } from '../types/app';
import { isFirmManagerRole } from '../lib/roleAccess';
import { PUBLIC_PAGES } from '../app/workspaceForms';

export interface WorkspacePageFlags {
  needsClients: boolean;
  needsCases: boolean;
  needsManagerDataOnEmployees: boolean;
  needsHeaderAlerts: boolean;
  needsEmployees: boolean;
  needsSessions: boolean;
  needsDocuments: boolean;
  needsLawyers: boolean;
  needsArchive: boolean;
  needsInvites: boolean;
  isPublicPage: boolean;
}

export function useWorkspacePageFlags(
  currentPage: PageId,
  isAuth: boolean,
  userRole?: UserRole | null
): WorkspacePageFlags {
  const needsManagerDataOnEmployees =
    isAuth &&
    (currentPage === 'employees' || currentPage === 'office-manager') &&
    Boolean(userRole && isFirmManagerRole(userRole));

  const needsClients =
    isAuth &&
    (currentPage === 'clients' ||
      currentPage === 'dashboard' ||
      currentPage === 'execution' ||
      currentPage === 'cases');

  const needsCases =
    isAuth &&
    (currentPage === 'dashboard' ||
      currentPage === 'execution' ||
      currentPage === 'cases' ||
      currentPage === 'archive' ||
      currentPage === 'reports' ||
      currentPage === 'sessions' ||
      needsManagerDataOnEmployees);

  const needsHeaderAlerts = isAuth && !PUBLIC_PAGES.includes(currentPage);
  const needsEmployees = isAuth && (currentPage === 'employees' || currentPage === 'settings' || currentPage === 'dashboard');
  const needsSessions = isAuth && (currentPage === 'sessions' || currentPage === 'dashboard' || currentPage === 'cases' || currentPage === 'case-detail');
  const needsDocuments = isAuth && (currentPage === 'documents' || currentPage === 'case-detail');
  const needsLawyers = isAuth && (currentPage === 'lawyers' || currentPage === 'cases' || currentPage === 'dashboard' || needsManagerDataOnEmployees);
  const needsArchive = isAuth && (currentPage === 'archive' || currentPage === 'reports');
  const needsInvites = isAuth && currentPage === 'employees';

  return {
    needsClients,
    needsCases,
    needsManagerDataOnEmployees,
    needsHeaderAlerts,
    needsEmployees,
    needsSessions,
    needsDocuments,
    needsLawyers,
    needsArchive,
    needsInvites,
    isPublicPage: PUBLIC_PAGES.includes(currentPage)
  };
}
